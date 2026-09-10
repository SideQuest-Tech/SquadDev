import { Redis } from '@upstash/redis/cloudflare'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createLogger } from '../_shared/logger.js'

const parseObj = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-login', traceId, env)
  const headers = { 'Access-Control-Allow-Origin': '*', 'X-Trace-Id': traceId }

  if (request.method !== 'POST') return Response.json({ ok: false }, { status: 405, headers })

  let body
  try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

  const { email, password } = body || {}
  if (!email || !password) return Response.json({ ok: false, error: 'Email and password required' }, { status: 400, headers })

  const normalizedEmail = email.toLowerCase().trim()
  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  try {
    const admin = parseObj(await redis.get('sidequest_admin'))
    if (admin && admin.email === normalizedEmail) {
      const match = await bcrypt.compare(password, admin.passwordHash)
      if (!match) {
        log.warn('Admin login failed — wrong password')
        return Response.json({ ok: false, error: 'Invalid credentials' }, { status: 401, headers })
      }
      log.info('Admin login success')
      return Response.json({ ok: true, role: 'admin' }, { status: 200, headers })
    }

    const client = parseObj(await redis.get(`client:${normalizedEmail}`))
    if (!client || !client.isActive) {
      log.warn('Client login failed — not found or inactive')
      return Response.json({ ok: false, error: 'Invalid credentials' }, { status: 401, headers })
    }

    const match = await bcrypt.compare(password, client.passwordHash)
    if (!match) {
      log.warn('Client login failed — wrong password')
      return Response.json({ ok: false, error: 'Invalid credentials' }, { status: 401, headers })
    }

    const token = jwt.sign(
      { sub: normalizedEmail, name: client.fullName, company: client.company, folderId: client.clickupFolderId, mustChangePassword: client.mustChangePassword },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    log.info('Client login success', { company: client.company })
    return Response.json({
      ok: true, role: 'client', token,
      client: { name: client.fullName, company: client.company, folderId: client.clickupFolderId, mustChangePassword: client.mustChangePassword }
    }, { status: 200, headers })
  } catch (err) {
    log.error('Login error', { message: err.message })
    return Response.json({ ok: false, error: 'Login failed. Please try again.' }, { status: 500, headers })
  }
}
