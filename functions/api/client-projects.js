import { Redis } from '@upstash/redis/cloudflare'
import { jwtVerify } from 'jose'
import * as Sentry from '@sentry/cloudflare'
import { createLogger } from '../_shared/logger.js'

const parseArr = raw => { if (!raw) return []; if (Array.isArray(raw)) return raw; try { return JSON.parse(raw) } catch { return [] } }
const parseObj = raw => { if (!raw) return null; if (typeof raw === 'object') return raw; try { return JSON.parse(raw) } catch { return null } }

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-client-projects', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (request.method !== 'GET') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return Response.json({ ok: false, error: 'Authorization required' }, { status: 401, headers })

  let payload
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET)
    ;({ payload } = await jwtVerify(token, secret))
  } catch {
    return Response.json({ ok: false, error: 'Invalid or expired token' }, { status: 401, headers })
  }

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

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
    return Response.json({ ok: true, projects: result }, { status: 200, headers })
  } catch (err) {
    Sentry.captureException(err, { extra: { traceId } })
    Sentry.metrics.increment('client_projects.error', 1)
    log.error('Failed to fetch client projects', { message: err.message })
    return Response.json({ ok: false, error: 'Failed to load projects.' }, { status: 500, headers })
  }
}
