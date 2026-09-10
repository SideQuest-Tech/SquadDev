import { Redis } from '@upstash/redis'
import jwt from 'jsonwebtoken'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-client-projects', traceId)

  res.setHeader('X-Trace-Id', traceId)

  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'Authorization required' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }

  const parseArr = raw => { if (!raw) return []; if (Array.isArray(raw)) return raw; try { return JSON.parse(raw) } catch { return [] } }
  const parseObj = raw => { if (!raw) return null; if (typeof raw === 'object') return raw; try { return JSON.parse(raw) } catch { return null } }

  try {
    const listIds = parseArr(await redis.get(`client_projects:${payload.sub}`))

    const projects = await Promise.all(
      listIds.map(async id => {
        const r = await redis.get(`project:${id}`)
        return r ? parseObj(r) : null
      })
    )

    const result = projects.filter(Boolean)
    log.info('Client projects fetched', { count: result.length })
    return res.status(200).json({ ok: true, projects: result })
  } catch (err) {
    log.error('Failed to fetch client projects', { message: err.message })
    return res.status(500).json({ ok: false, error: 'Failed to load projects.' })
  }
}
