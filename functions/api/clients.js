import { Redis } from '@upstash/redis/cloudflare'
import * as Sentry from '@sentry/cloudflare'
import { createLogger } from '../_shared/logger.js'

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
  const log = createLogger('fn-clients', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (request.headers.get('x-admin-secret') !== env.ADMIN_SECRET) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })
  }

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  if (request.method === 'GET') {
    try {
      const emails = parseArr(await redis.get('approved_clients'))
      const clients = await Promise.all(
        emails.map(async email => {
          const raw = await redis.get(`client:${email}`)
          if (!raw) return null
          const record = parseObj(raw)
          const { passwordHash, ...safe } = record
          return safe
        })
      )
      const result = clients.filter(Boolean)
      log.info('Clients fetched', { count: result.length })
      return Response.json({ ok: true, clients: result }, { status: 200, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { traceId } })
      Sentry.metrics.increment('clients.error', 1, { tags: { operation: 'fetch' } })
      log.error('Failed to fetch clients', { message: err.message })
      return Response.json({ ok: false, error: 'Failed to load clients.' }, { status: 500, headers })
    }
  }

  if (request.method === 'POST') {
    let body
    try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

    const { action, email, projectName } = body || {}
    if (!action || !email) return Response.json({ ok: false, error: 'action and email are required' }, { status: 400, headers })

    const normalizedEmail = email.toLowerCase().trim()
    const clientKey = `client:${normalizedEmail}`

    try {
      const raw = await redis.get(clientKey)
      if (!raw) return Response.json({ ok: false, error: 'Client not found' }, { status: 404, headers })
      const record = parseObj(raw)

      if (action === 'deactivate') {
        await redis.set(clientKey, JSON.stringify({ ...record, isActive: false }))
        if (record.clickupFolderId) {
          await clickup(`/folder/${record.clickupFolderId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: true })
          }, env)
        }
        Sentry.metrics.increment('clients.action', 1, { tags: { action: 'deactivate' } })
        log.info('Client deactivated', { company: record.company })
        return Response.json({ ok: true }, { status: 200, headers })
      }

      if (action === 'reactivate') {
        await redis.set(clientKey, JSON.stringify({ ...record, isActive: true }))
        if (record.clickupFolderId) {
          await clickup(`/folder/${record.clickupFolderId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: false })
          }, env)
        }
        Sentry.metrics.increment('clients.action', 1, { tags: { action: 'reactivate' } })
        log.info('Client reactivated', { company: record.company })
        return Response.json({ ok: true }, { status: 200, headers })
      }

      if (action === 'remove') {
        await redis.del(clientKey)
        const emails = parseArr(await redis.get('approved_clients'))
        await redis.set('approved_clients', JSON.stringify(emails.filter(e => e !== normalizedEmail)))
        Sentry.metrics.increment('clients.action', 1, { tags: { action: 'remove' } })
        log.info('Client removed', { company: record.company })
        return Response.json({ ok: true }, { status: 200, headers })
      }

      if (action === 'add-project') {
        if (!projectName) return Response.json({ ok: false, error: 'projectName is required' }, { status: 400, headers })
        const listRes = await clickup(`/folder/${record.clickupFolderId}/list`, {
          method: 'POST',
          body: JSON.stringify({ name: projectName })
        }, env)
        if (!listRes.id) {
          Sentry.metrics.increment('clients.clickup_failed', 1, { tags: { operation: 'create_list' } })
          log.error('ClickUp list creation failed', { response: JSON.stringify(listRes) })
          return Response.json({ ok: false, error: 'Failed to create project list. Check ClickUp configuration.' }, { status: 500, headers })
        }

        const projectRecord = {
          listId: listRes.id,
          listName: projectName,
          clientEmail: normalizedEmail,
          folderId: record.clickupFolderId,
          projectStatus: 'in_progress',
          pauseReason: null,
          archivedAt: null,
          createdAt: new Date().toISOString()
        }
        await redis.set(`project:${listRes.id}`, JSON.stringify(projectRecord))

        const clientProjects = parseArr(await redis.get(`client_projects:${normalizedEmail}`))
        clientProjects.push(listRes.id)
        await redis.set(`client_projects:${normalizedEmail}`, JSON.stringify(clientProjects))

        Sentry.metrics.increment('clients.action', 1, { tags: { action: 'add_project' } })
        log.info('Project added to client', { listId: listRes.id, company: record.company })
        return Response.json({ ok: true, listId: listRes.id }, { status: 200, headers })
      }

      return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { action, traceId } })
      Sentry.metrics.increment('clients.error', 1, { tags: { operation: action ?? 'unknown' } })
      log.error('Client action failed', { action, message: err.message })
      return Response.json({ ok: false, error: 'Action failed. Please try again.' }, { status: 500, headers })
    }
  }

  return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })
}
