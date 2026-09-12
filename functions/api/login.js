import { Redis } from '@upstash/redis/cloudflare'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import * as Sentry from '@sentry/cloudflare'
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
        Sentry.metrics.count('login.failed', 1, { tags: { role: 'admin', reason: 'wrong_password' } })
        return Response.json({ ok: false, error: 'Invalid credentials' }, { status: 401, headers })
      }
      const adminSecret = new TextEncoder().encode(env.JWT_SECRET)
      const adminToken = await new SignJWT({ sub: normalizedEmail, role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .sign(adminSecret)
      Sentry.metrics.count('login.success', 1, { tags: { role: 'admin' } })
      log.info('Admin login success')
      return Response.json({ ok: true, role: 'admin', token: adminToken }, { status: 200, headers })
    }

    const client = parseObj(await redis.get(`client:${normalizedEmail}`))
    if (!client || !client.isActive) {
      log.warn('Client login failed — not found or inactive')
      Sentry.metrics.count('login.failed', 1, { tags: { role: 'client', reason: 'not_found' } })
      return Response.json({ ok: false, error: 'Invalid credentials' }, { status: 401, headers })
    }

    const match = await bcrypt.compare(password, client.passwordHash)
    if (!match) {
      log.warn('Client login failed — wrong password')
      Sentry.metrics.count('login.failed', 1, { tags: { role: 'client', reason: 'wrong_password' } })
      return Response.json({ ok: false, error: 'Invalid credentials' }, { status: 401, headers })
    }

    const secret = new TextEncoder().encode(env.JWT_SECRET)
    const token = await new SignJWT({ sub: normalizedEmail, name: client.fullName, company: client.company, folderId: client.clickupFolderId, mustChangePassword: client.mustChangePassword })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    Sentry.metrics.count('login.success', 1, { tags: { role: 'client' } })
    log.info('Client login success', { company: client.company })
    return Response.json({
      ok: true, role: 'client', token,
      client: { name: client.fullName, company: client.company, folderId: client.clickupFolderId, mustChangePassword: client.mustChangePassword }
    }, { status: 200, headers })
  } catch (err) {
    Sentry.captureException(err, { extra: { traceId } })
    Sentry.metrics.count('login.error', 1)
    log.error('Login error', { message: err.message })
    return Response.json({ ok: false, error: 'Login failed. Please try again.' }, { status: 500, headers })
  }
}
