import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const parseObj = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-login', traceId)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('X-Trace-Id', traceId)

  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' })

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const admin = parseObj(await redis.get('sidequest_admin'))
    if (admin && admin.email === normalizedEmail) {
      const match = await bcrypt.compare(password, admin.passwordHash)
      if (!match) {
        log.warn('Admin login failed — wrong password')
        return res.status(401).json({ ok: false, error: 'Invalid credentials' })
      }
      log.info('Admin login success')
      return res.status(200).json({ ok: true, role: 'admin' })
    }

    const client = parseObj(await redis.get(`client:${normalizedEmail}`))
    if (!client || !client.isActive) {
      log.warn('Client login failed — not found or inactive')
      return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }

    const match = await bcrypt.compare(password, client.passwordHash)
    if (!match) {
      log.warn('Client login failed — wrong password')
      return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { sub: normalizedEmail, name: client.fullName, company: client.company, folderId: client.clickupFolderId, mustChangePassword: client.mustChangePassword },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    log.info('Client login success', { company: client.company })
    return res.status(200).json({
      ok: true, role: 'client', token,
      client: { name: client.fullName, company: client.company, folderId: client.clickupFolderId, mustChangePassword: client.mustChangePassword }
    })
  } catch (err) {
    log.error('Login error', { message: err.message })
    return res.status(500).json({ ok: false, error: 'Login failed. Please try again.' })
  }
}
