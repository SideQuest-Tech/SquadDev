import { Redis } from '@upstash/redis/cloudflare'
import * as Sentry from '@sentry/cloudflare'
import { createLogger } from '../_shared/logger.js'
import { verifyAdminToken } from '../_shared/adminAuth.js'

const parseArr = raw => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

const parseObj = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

const clickup = (path, options = {}, env) =>
  fetch(`https://api.clickup.com/api/v2${path}`, {
    ...options,
    headers: { Authorization: env.CLICKUP_API_TOKEN, 'Content-Type': 'application/json', ...options.headers }
  }).then(r => r.json())

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-projects', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (!await verifyAdminToken(request, env)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })
  }

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  if (request.method === 'GET') {
    try {
      const email = new URL(request.url).searchParams.get('email')
      let listIds = []

      if (email) {
        listIds = parseArr(await redis.get(`client_projects:${email.toLowerCase().trim()}`))
      } else {
        const emails = parseArr(await redis.get('approved_clients'))
        const allLists = await Promise.all(
          emails.map(e => redis.get(`client_projects:${e}`).then(v => parseArr(v)))
        )
        listIds = allLists.flat()
      }

      const projects = await Promise.all(
        listIds.map(async id => {
          const raw = await redis.get(`project:${id}`)
          return raw ? parseObj(raw) : null
        })
      )

      const result = projects.filter(Boolean)
      log.info('Projects fetched', { count: result.length, ...(email && { forEmail: '[redacted]' }) })
      return Response.json({ ok: true, projects: result }, { status: 200, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { traceId } })
      Sentry.metrics.count('projects.error', 1, { tags: { operation: 'fetch' } })
      log.error('Failed to fetch projects', { message: err.message })
      return Response.json({ ok: false, error: 'Failed to load projects.' }, { status: 500, headers })
    }
  }

  if (request.method === 'POST') {
    let body
    try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

    const { action, listId, newStatus, pauseReason } = body || {}
    if (!action || !listId) return Response.json({ ok: false, error: 'action and listId are required' }, { status: 400, headers })

    try {
      const raw = await redis.get(`project:${listId}`)
      if (!raw) return Response.json({ ok: false, error: 'Project not found' }, { status: 404, headers })
      const project = parseObj(raw)

      if (action === 'update-status') {
        if (!newStatus) return Response.json({ ok: false, error: 'newStatus is required' }, { status: 400, headers })
        const validStatuses = ['in_progress', 'paused', 'cancelled', 'completed']
        if (!validStatuses.includes(newStatus)) {
          return Response.json({ ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400, headers })
        }

        const updates = { projectStatus: newStatus }

        if (newStatus === 'paused') {
          updates.pauseReason = pauseReason || 'Project temporarily on hold'
        } else if (newStatus === 'in_progress') {
          updates.pauseReason = null
        } else if (newStatus === 'cancelled' || newStatus === 'completed') {
          updates.archivedAt = new Date().toISOString()
          updates.pauseReason = null
          await clickup(`/list/${listId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: true })
          }, env)
        }

        await redis.set(`project:${listId}`, JSON.stringify({ ...project, ...updates }))
        Sentry.metrics.count('projects.status_updated', 1, { tags: { status: newStatus } })
        log.info('Project status updated', { listId, newStatus })
        return Response.json({ ok: true }, { status: 200, headers })
      }

      return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { action, listId, traceId } })
      Sentry.metrics.count('projects.error', 1, { tags: { operation: action ?? 'unknown' } })
      log.error('Project action failed', { action, listId, message: err.message })
      return Response.json({ ok: false, error: 'Action failed. Please try again.' }, { status: 500, headers })
    }
  }

  return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })
}
