import { Redis } from '@upstash/redis'
import { google } from 'googleapis'
import { Resend } from 'resend'
import jwt from 'jsonwebtoken'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})
const resend = new Resend(process.env.RESEND_API_KEY)

const isAdmin = req => req.headers['x-admin-secret'] === process.env.ADMIN_SECRET

const verifyClient = req => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch { return null }
}

const parse = raw => (typeof raw === 'string' ? JSON.parse(raw) : raw)

async function createGoogleMeet(meeting, confirmedTime) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const start = new Date(confirmedTime)
  const end = new Date(start.getTime() + (meeting.duration || 60) * 60000)

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: meeting.title,
      description: meeting.message || `Meeting with ${meeting.clientName}`,
      start: { dateTime: start.toISOString(), timeZone: 'Africa/Johannesburg' },
      end: { dateTime: end.toISOString(), timeZone: 'Africa/Johannesburg' },
      attendees: [{ email: meeting.clientEmail }],
      conferenceData: {
        createRequest: {
          requestId: meeting.id,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }
  })

  return {
    meetLink: event.data.hangoutLink,
    calendarEventId: event.data.id
  }
}

const fmtDate = iso =>
  new Date(iso).toLocaleString('en-ZA', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Johannesburg'
  })

async function sendConfirmationEmail(meeting) {
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

async function sendDeclineEmail(meeting) {
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

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-meetings-respond', traceId)
  res.setHeader('X-Trace-Id', traceId)

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const admin = isAdmin(req)
  const client = verifyClient(req)
  if (!admin && !client) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  const { meetingId, action, confirmedTime } = req.body || {}
  if (!meetingId || !action) return res.status(400).json({ ok: false, error: 'meetingId and action required' })
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ ok: false, error: 'action must be accept or decline' })
  if (action === 'accept' && !confirmedTime) return res.status(400).json({ ok: false, error: 'confirmedTime required to accept' })

  try {
    const raw = await redis.get(`meeting:${meetingId}`)
    if (!raw) return res.status(404).json({ ok: false, error: 'Meeting not found' })
    const meeting = parse(raw)

    // Enforce: admin can only respond to client-proposed meetings, client to admin-proposed
    if (admin && meeting.proposedBy !== 'client') {
      return res.status(403).json({ ok: false, error: 'Only client-proposed meetings can be accepted by admin here' })
    }
    if (client && meeting.proposedBy !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Only admin-proposed meetings can be accepted by the client' })
    }
    if (client && meeting.clientEmail !== client.sub) {
      return res.status(403).json({ ok: false, error: 'Access denied' })
    }

    if (action === 'decline') {
      await redis.set(`meeting:${meetingId}`, JSON.stringify({ ...meeting, status: 'declined' }))
      try { await sendDeclineEmail(meeting) } catch (e) { log.warn('Decline email failed', { message: e.message }) }
      log.info('Meeting declined', { meetingId })
      return res.status(200).json({ ok: true })
    }

    // Accept — create Google Meet
    let meetLink, calendarEventId
    try {
      const result = await createGoogleMeet(meeting, confirmedTime)
      meetLink = result.meetLink
      calendarEventId = result.calendarEventId
    } catch (err) {
      log.error('Google Calendar event creation failed', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Failed to create Google Meet. Check Google credentials.' })
    }

    const updated = { ...meeting, status: 'accepted', confirmedTime, meetLink, calendarEventId }
    await redis.set(`meeting:${meetingId}`, JSON.stringify(updated))

    try { await sendConfirmationEmail(updated) } catch (e) { log.warn('Confirmation email failed', { message: e.message }) }

    log.info('Meeting accepted', { meetingId })
    return res.status(200).json({ ok: true, meetLink })
  } catch (err) {
    log.error('Failed to process meeting response', { message: err.message })
    return res.status(500).json({ ok: false, error: 'Failed to process response.' })
  }
}
