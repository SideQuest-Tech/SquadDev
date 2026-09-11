import { Redis } from '@upstash/redis/cloudflare'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import * as Sentry from '@sentry/cloudflare'
import { createLogger } from '../_shared/logger.js'

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return 'SQT-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-forgot-password', traceId, env)
  const headers = { 'Access-Control-Allow-Origin': '*', 'X-Trace-Id': traceId }

  if (request.method !== 'POST') return Response.json({ ok: false }, { status: 405, headers })

  let body
  try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

  const { email } = body || {}
  if (!email) {
    log.warn('Forgot password — missing email in request body')
    return Response.json({ ok: false, error: 'Email required' }, { status: 400, headers })
  }

  const normalizedEmail = email.toLowerCase().trim()
  log.info('Forgot password requested', { email: normalizedEmail })

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  // Always return generic success — never reveal if account exists
  const genericOk = Response.json({ ok: true }, { status: 200, headers })

  try {
    const raw = await redis.get(`client:${normalizedEmail}`)
    const client = raw && (typeof raw === 'object' ? raw : (() => { try { return JSON.parse(raw) } catch { return null } })())

    if (!client || !client.isActive) {
      log.warn('Forgot password — account not found or inactive', { email: normalizedEmail })
      Sentry.metrics.increment('forgot_password.account_not_found', 1, { tags: { email_domain: normalizedEmail.split('@')[1] } })
      return genericOk
    }

    const tempPassword = generatePassword()
    log.info('Generating temporary password', { email: normalizedEmail })

    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await redis.set(`client:${normalizedEmail}`, JSON.stringify({ ...client, passwordHash }))
    log.info('Temporary password stored', { email: normalizedEmail })

    const resend = new Resend(env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SideQuest Tech <hello@sidequesttech.co.za>',
      to: normalizedEmail,
      subject: 'Your temporary password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2a3a">
          <h2 style="margin-bottom:4px">Hi ${client.fullName},</h2>
          <p>We received a password reset request for your SideQuest Tech portal account.</p>
          <p>Use this temporary password to sign in:</p>
          <div style="background:#f3f6fa;border-radius:8px;padding:16px 20px;margin:20px 0">
            <p style="margin:0 0 6px"><strong>Email:</strong> ${normalizedEmail}</p>
            <p style="margin:0"><strong>Temporary password:</strong> ${tempPassword}</p>
          </div>
          <p>Once signed in, you can change your password from your profile settings.</p>
          <p>If you did not request this, contact us at <a href="mailto:hello@sidequesttech.co.za">hello@sidequesttech.co.za</a>.</p>
          <a href="https://www.sidequesttech.co.za" style="display:inline-block;margin-top:8px;padding:11px 22px;background:#2676ff;color:white;border-radius:7px;text-decoration:none;font-weight:700">Open Client Portal</a>
          <p style="margin-top:28px;color:#8994a3;font-size:12px">SideQuest Tech · hello@sidequesttech.co.za</p>
        </div>
      `
    })

    Sentry.metrics.increment('forgot_password.email_sent', 1)
    log.info('Temporary password email sent', { email: normalizedEmail })
    return genericOk
  } catch (err) {
    Sentry.captureException(err, { extra: { email: normalizedEmail, traceId } })
    Sentry.metrics.increment('forgot_password.error', 1, { tags: { reason: err.message?.slice(0, 64) ?? 'unknown' } })
    log.error('Forgot password failed', { message: err.message, email: normalizedEmail })
    return Response.json({ ok: false, error: 'Could not process request. Please try again.' }, { status: 500, headers })
  }
}
