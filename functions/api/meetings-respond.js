import { Redis } from '@upstash/redis/cloudflare'
import { Resend } from 'resend'
import jwt from 'jsonwebtoken'
import * as Sentry from '@sentry/cloudflare'
import { createLogger } from '../_shared/logger.js'

const parse = raw => (typeof raw === 'string' ? JSON.parse(raw) : raw)

async function createGoogleMeet(meeting, confirmedTime, env) {
  // Exchange refresh token for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  })
  const { access_token } = await tokenRes.json()

  // Create calendar event with conference data
  const start = new Date(confirmedTime)
  const end = new Date(start.getTime() + (meeting.duration || 60) * 60000)

  const eventRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: meeting.title,
        description: meeting.message || `Meeting with ${meeting.clientName}`,
        start: { dateTime: start.toISOString(), timeZone: 'Africa/Johannesburg' },
        end: { dateTime: end.toISOString(), timeZone: 'Africa/Johannesburg' },
        attendees: [{ email: meeting.clientEmail }],
        conferenceData: {
          createRequest: { requestId: meeting.id, conferenceSolutionKey: { type: 'hangoutsMeet' } }
        }
      })
    }
  )
  const event = await eventRes.json()
  return { meetLink: event.hangoutLink, calendarEventId: event.id }
}

const fmtDate = iso =>
  new Date(iso).toLocaleString('en-ZA', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Johannesburg'
  })

async function sendConfirmationEmail(meeting, resend) {
  await resend.emails.send({
    from: 'SideQuest Tech <hello@sidequesttech.co.za>',
    to: meeting.clientEmail,
    subject: `Meeting confirmed: ${meeting.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2a3a">
        <h2>Your meeting is confirmed</h2>
        <p>Hi ${meeting.clientName},</p>
        <p>Your meeting <strong>${meeting.title}</strong> has been confirmed.</p>
        <div style="background:#f3f6fa;border-radius:8px;padding:16px 20px;margin:20px 0">
          <p style="margin:0 0 6px"><strong>When:</strong> ${fmtDate(meeting.confirmedTime)}</p>
          <p style="margin:0 0 6px"><strong>Duration:</strong> ${meeting.duration} minutes</p>
          <p style="margin:0"><strong>Google Meet:</strong> <a href="${meeting.meetLink}">${meeting.meetLink}</a></p>
        </div>
        <a href="${meeting.meetLink}" style="display:inline-block;margin-top:8px;padding:11px 22px;background:#2676ff;color:white;border-radius:7px;text-decoration:none;font-weight:700">Join Google Meet</a>
        <p style="margin-top:20px;color:#8994a3;font-size:12px">You can also add this to your calendar from the client portal.</p>
      </div>
    `
  })
}

async function sendDeclineEmail(meeting, resend) {
  await resend.emails.send({
    from: 'SideQuest Tech <hello@sidequesttech.co.za>',
    to: meeting.clientEmail,
    subject: `Meeting request update: ${meeting.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2a3a">
        <h2>Meeting request update</h2>
        <p>Hi ${meeting.clientName},</p>
        <p>Unfortunately we are unable to accommodate the proposed times for <strong>${meeting.title}</strong>.</p>
        <p>Please submit a new request with alternative times and we will do our best to find a slot that works.</p>
        <p style="margin-top:28px;color:#8994a3;font-size:12px">SideQuest Tech · hello@sidequesttech.co.za</p>
      </div>
    `
  })
}

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-meetings-respond', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (request.method !== 'POST') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })

  const isAdmin = request.headers.get('x-admin-secret') === env.ADMIN_SECRET
  const verifyClient = () => {
    try {
      const auth = request.headers.get('authorization') || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
      if (!token) return null
      return jwt.verify(token, env.JWT_SECRET)
    } catch { return null }
  }

  const admin = isAdmin
  const client = verifyClient()
  if (!admin && !client) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })

  let body
  try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

  const { meetingId, action, confirmedTime } = body || {}
  if (!meetingId || !action) return Response.json({ ok: false, error: 'meetingId and action required' }, { status: 400, headers })
  if (!['accept', 'decline'].includes(action)) return Response.json({ ok: false, error: 'action must be accept or decline' }, { status: 400, headers })
  if (action === 'accept' && !confirmedTime) return Response.json({ ok: false, error: 'confirmedTime required to accept' }, { status: 400, headers })

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
  const resend = new Resend(env.RESEND_API_KEY)

  try {
    const raw = await redis.get(`meeting:${meetingId}`)
    if (!raw) return Response.json({ ok: false, error: 'Meeting not found' }, { status: 404, headers })
    const meeting = parse(raw)

    // Enforce: admin can only respond to client-proposed meetings, client to admin-proposed
    if (admin && meeting.proposedBy !== 'client') {
      return Response.json({ ok: false, error: 'Only client-proposed meetings can be accepted by admin here' }, { status: 403, headers })
    }
    if (client && meeting.proposedBy !== 'admin') {
      return Response.json({ ok: false, error: 'Only admin-proposed meetings can be accepted by the client' }, { status: 403, headers })
    }
    if (client && meeting.clientEmail !== client.sub) {
      return Response.json({ ok: false, error: 'Access denied' }, { status: 403, headers })
    }

    if (action === 'decline') {
      await redis.set(`meeting:${meetingId}`, JSON.stringify({ ...meeting, status: 'declined' }))
      try { await sendDeclineEmail(meeting, resend) } catch (e) {
        Sentry.metrics.increment('meetings.email_failed', 1, { tags: { type: 'decline' } })
        log.warn('Decline email failed', { message: e.message })
      }
      Sentry.metrics.increment('meetings.declined', 1)
      log.info('Meeting declined', { meetingId })
      return Response.json({ ok: true }, { status: 200, headers })
    }

    // Accept — create Google Meet via REST API
    let meetLink, calendarEventId
    try {
      const result = await createGoogleMeet(meeting, confirmedTime, env)
      meetLink = result.meetLink
      calendarEventId = result.calendarEventId
    } catch (err) {
      Sentry.captureException(err, { extra: { meetingId, traceId } })
      Sentry.metrics.increment('meetings.google_meet_failed', 1)
      log.error('Google Calendar event creation failed', { message: err.message })
      return Response.json({ ok: false, error: 'Failed to create Google Meet. Check Google credentials.' }, { status: 500, headers })
    }

    const updated = { ...meeting, status: 'accepted', confirmedTime, meetLink, calendarEventId }
    await redis.set(`meeting:${meetingId}`, JSON.stringify(updated))

    try { await sendConfirmationEmail(updated, resend) } catch (e) {
      Sentry.metrics.increment('meetings.email_failed', 1, { tags: { type: 'confirmation' } })
      log.warn('Confirmation email failed', { message: e.message })
    }

    Sentry.metrics.increment('meetings.accepted', 1)
    log.info('Meeting accepted', { meetingId })
    return Response.json({ ok: true, meetLink }, { status: 200, headers })
  } catch (err) {
    Sentry.captureException(err, { extra: { meetingId, traceId } })
    Sentry.metrics.increment('meetings.error', 1, { tags: { operation: 'respond' } })
    log.error('Failed to process meeting response', { message: err.message })
    return Response.json({ ok: false, error: 'Failed to process response.' }, { status: 500, headers })
  }
}
