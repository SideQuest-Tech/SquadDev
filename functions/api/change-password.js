import { Redis } from '@upstash/redis/cloudflare'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createLogger } from '../_shared/logger.js'

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-change-password', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (request.method !== 'POST') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return Response.json({ ok: false, error: 'Authorization token required' }, { status: 401, headers })

  let payload
  try {
    payload = jwt.verify(token, env.JWT_SECRET)
  } catch {
    return Response.json({ ok: false, error: 'Invalid or expired token' }, { status: 401, headers })
  }

  let body
  try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

  const { currentPassword, newPassword } = body || {}
  if (!currentPassword || !newPassword) {
    return Response.json({ ok: false, error: 'currentPassword and newPassword are required' }, { status: 400, headers })
  }
  if (newPassword.length < 8) {
    return Response.json({ ok: false, error: 'New password must be at least 8 characters' }, { status: 400, headers })
  }

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  try {
    const raw = await redis.get(`client:${payload.sub}`)
    if (!raw) return Response.json({ ok: false, error: 'Account not found' }, { status: 404, headers })

    const record = typeof raw === 'string' ? JSON.parse(raw) : raw
    const match = await bcrypt.compare(currentPassword, record.passwordHash)
    if (!match) {
      log.warn('Password change failed — wrong current password')
      return Response.json({ ok: false, error: 'Current password is incorrect' }, { status: 401, headers })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await redis.set(`client:${payload.sub}`, JSON.stringify({
      ...record,
      passwordHash: newHash,
      mustChangePassword: false
    }))

    log.info('Password changed successfully')
    return Response.json({ ok: true }, { status: 200, headers })
  } catch (err) {
    log.error('Password change error', { message: err.message })
    return Response.json({ ok: false, error: 'Could not update password. Please try again.' }, { status: 500, headers })
  }
}
