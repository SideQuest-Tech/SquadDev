import { Redis } from '@upstash/redis'
import jwt from 'jsonwebtoken'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const isAdmin = req => req.headers['x-admin-secret'] === process.env.ADMIN_SECRET

const verifyClient = req => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch { return null }
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

async function addToIndexes(id, clientEmail) {
  const allRaw = await redis.get('all_meetings')
  const all = parseArr(allRaw)
  if (!all.includes(id)) { all.unshift(id); await redis.set('all_meetings', JSON.stringify(all)) }

  const cmRaw = await redis.get(`client_meetings:${clientEmail}`)
  const cm = parseArr(cmRaw)
  if (!cm.includes(id)) { cm.unshift(id); await redis.set(`client_meetings:${clientEmail}`, JSON.stringify(cm)) }
}

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-meetings', traceId)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('X-Trace-Id', traceId)

  if (req.method === 'GET') {
    const admin = isAdmin(req)
    const client = verifyClient(req)
    if (!admin && !client) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    try {
      let ids = []
      if (admin) {
        const raw = await redis.get('all_meetings')
        ids = parseArr(raw)
      } else {
        const raw = await redis.get(`client_meetings:${client.sub}`)
        ids = parseArr(raw)
      }

      const meetings = (await Promise.all(
        ids.map(async id => {
          const r = await redis.get(`meeting:${id}`)
          return r ? parse(r) : null
        })
      )).filter(Boolean)

      log.info('Meetings fetched', { count: meetings.length, role: admin ? 'admin' : 'client' })
      return res.status(200).json({ ok: true, meetings })
    } catch (err) {
      log.error('Failed to fetch meetings', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Failed to load meetings.' })
    }
  }

  if (req.method === 'POST') {
    const admin = isAdmin(req)
    const client = verifyClient(req)
    if (!admin && !client) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const { title, message, duration = 60, proposedTimes, clientEmail, clientName } = req.body || {}
    if (!title || !proposedTimes?.length) {
      return res.status(400).json({ ok: false, error: 'title and proposedTimes are required' })
    }

    try {
      const id = genId()
      let meeting

      if (admin) {
        if (!clientEmail) return res.status(400).json({ ok: false, error: 'clientEmail required' })
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
        await addToIndexes(id, email)
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
        await addToIndexes(id, client.sub)
      }

      log.info('Meeting created', { id, proposedBy: admin ? 'admin' : 'client' })
      return res.status(201).json({ ok: true, id })
    } catch (err) {
      log.error('Failed to create meeting', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Failed to create meeting.' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
