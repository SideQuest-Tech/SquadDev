import { Redis } from '@upstash/redis/cloudflare'
import jwt from 'jsonwebtoken'
import { createLogger } from '../_shared/logger.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-admin-secret,x-trace-id'
}

const parse = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

const parseArr = raw => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

const genId = () => `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

async function addToIndexes(redis, id, clientEmail) {
  const all = parseArr(await redis.get('all_meetings'))
  if (!all.includes(id)) { all.unshift(id); await redis.set('all_meetings', JSON.stringify(all)) }

  const cm = parseArr(await redis.get(`client_meetings:${clientEmail}`))
  if (!cm.includes(id)) { cm.unshift(id); await redis.set(`client_meetings:${clientEmail}`, JSON.stringify(cm)) }
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-meetings', traceId, env)
  const headers = { ...CORS_HEADERS, 'X-Trace-Id': traceId }

  const isAdmin = request.headers.get('x-admin-secret') === env.ADMIN_SECRET

  const verifyClient = () => {
    try {
      const auth = request.headers.get('authorization') || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
      if (!token) return null
      return jwt.verify(token, env.JWT_SECRET)
    } catch { return null }
  }

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  if (request.method === 'GET') {
    const admin = isAdmin
    const client = verifyClient()
    if (!admin && !client) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })

    try {
      let ids = []
      if (admin) {
        ids = parseArr(await redis.get('all_meetings'))
      } else {
        ids = parseArr(await redis.get(`client_meetings:${client.sub}`))
      }

      const meetings = (await Promise.all(
        ids.map(async id => {
          const r = await redis.get(`meeting:${id}`)
          return r ? parse(r) : null
        })
      )).filter(Boolean)

      log.info('Meetings fetched', { count: meetings.length, role: admin ? 'admin' : 'client' })
      return Response.json({ ok: true, meetings }, { status: 200, headers })
    } catch (err) {
      log.error('Failed to fetch meetings', { message: err.message })
      return Response.json({ ok: false, error: 'Failed to load meetings.' }, { status: 500, headers })
    }
  }

  if (request.method === 'POST') {
    const admin = isAdmin
    const client = verifyClient()
    if (!admin && !client) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })

    let body
    try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

    const { title, message, duration = 60, proposedTimes, clientEmail, clientName } = body || {}
    if (!title || !proposedTimes?.length) {
      return Response.json({ ok: false, error: 'title and proposedTimes are required' }, { status: 400, headers })
    }

    try {
      const id = genId()
      let meeting

      if (admin) {
        if (!clientEmail) return Response.json({ ok: false, error: 'clientEmail required' }, { status: 400, headers })
        const email = clientEmail.toLowerCase().trim()
        meeting = {
          id, title, message: message || '',
          clientEmail: email, clientName: clientName || email,
          proposedBy: 'admin', status: 'pending',
          proposedTimes, duration,
          confirmedTime: null, meetLink: null, calendarEventId: null,
          createdAt: new Date().toISOString()
        }
        await redis.set(`meeting:${id}`, JSON.stringify(meeting))
        await addToIndexes(redis, id, email)
      } else {
        meeting = {
          id, title, message: message || '',
          clientEmail: client.sub, clientName: client.name, company: client.company,
          proposedBy: 'client', status: 'pending',
          proposedTimes, duration,
          confirmedTime: null, meetLink: null, calendarEventId: null,
          createdAt: new Date().toISOString()
        }
        await redis.set(`meeting:${id}`, JSON.stringify(meeting))
        await addToIndexes(redis, id, client.sub)
      }

      log.info('Meeting created', { id, proposedBy: admin ? 'admin' : 'client' })
      return Response.json({ ok: true, id }, { status: 201, headers })
    } catch (err) {
      log.error('Failed to create meeting', { message: err.message })
      return Response.json({ ok: false, error: 'Failed to create meeting.' }, { status: 500, headers })
    }
  }

  return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })
}
