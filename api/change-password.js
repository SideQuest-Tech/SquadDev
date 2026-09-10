import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-change-password', traceId)

  res.setHeader('X-Trace-Id', traceId)

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'Authorization token required' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }

  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, error: 'currentPassword and newPassword are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'New password must be at least 8 characters' })
  }

  try {
    const raw = await redis.get(`client:${payload.sub}`)
    if (!raw) return res.status(404).json({ ok: false, error: 'Account not found' })

    const record = typeof raw === 'string' ? JSON.parse(raw) : raw
    const match = await bcrypt.compare(currentPassword, record.passwordHash)
    if (!match) {
      log.warn('Password change failed — wrong current password')
      return res.status(401).json({ ok: false, error: 'Current password is incorrect' })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await redis.set(`client:${payload.sub}`, JSON.stringify({
      ...record,
      passwordHash: newHash,
      mustChangePassword: false
    }))

    log.info('Password changed successfully')
    return res.status(200).json({ ok: true })
  } catch (err) {
    log.error('Password change error', { message: err.message })
    return res.status(500).json({ ok: false, error: 'Could not update password. Please try again.' })
  }
}
