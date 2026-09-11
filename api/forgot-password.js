import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})
const resend = new Resend(process.env.RESEND_API_KEY)

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return 'SQT-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const parseObj = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

// Increment a Sentry counter metric via the envelope HTTP API
function sentryIncrement(metric, tags = {}) {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  try {
    const url = new URL(dsn)
    const key = url.username
    const projectId = url.pathname.replace(/^\//, '')
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/envelope/`
    const tagStr = Object.entries(tags).map(([k, v]) => `${k}:${v}`).join(',')
    const bucketKey = `c:custom/${metric}@none`
    const now = Math.floor(Date.now() / 1000)
    const header = JSON.stringify({ sent_at: new Date().toISOString(), dsn })
    const metricHeader = JSON.stringify({ type: 'statsd', length: 0 })
    const payload = `${bucketKey}:1|c|${tagStr ? `#${tagStr}` : ''}|T${now}\n`
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}`,
      },
      body: `${header}\n${metricHeader}\n${payload}`,
    }).catch(() => {})
  } catch {}
}

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-forgot-password', traceId)
  res.setHeader('X-Trace-Id', traceId)

  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { email } = req.body || {}
  if (!email) {
    log.warn('Forgot password — missing email in request body')
    return res.status(400).json({ ok: false, error: 'Email required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  log.info('Forgot password requested', { email: normalizedEmail })

  // Always return generic success — never reveal if account exists
  const genericOk = () => res.status(200).json({ ok: true })

  try {
    const client = parseObj(await redis.get(`client:${normalizedEmail}`))

    if (!client || !client.isActive) {
      log.warn('Forgot password — account not found or inactive', { email: normalizedEmail })
      sentryIncrement('forgot_password.account_not_found', { email_domain: normalizedEmail.split('@')[1] })
      return genericOk()
    }

    const tempPassword = generatePassword()
    log.info('Generating temporary password', { email: normalizedEmail })

    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await redis.set(`client:${normalizedEmail}`, JSON.stringify({ ...client, passwordHash }))
    log.info('Temporary password stored', { email: normalizedEmail })

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

    sentryIncrement('forgot_password.email_sent')
    log.info('Temporary password email sent', { email: normalizedEmail })
    return genericOk()
  } catch (err) {
    sentryIncrement('forgot_password.error', { reason: (err.message ?? 'unknown').slice(0, 64) })
    log.error('Forgot password failed', { message: err.message, email: normalizedEmail })
    return res.status(500).json({ ok: false, error: 'Could not process request. Please try again.' })
  }
}
