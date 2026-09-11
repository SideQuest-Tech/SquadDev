import { Redis } from '@upstash/redis/cloudflare'
import * as Sentry from '@sentry/cloudflare'
import { createLogger } from '../_shared/logger.js'

const KEY = 'sidequest_requests'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-admin-secret,x-trace-id'
}

const getAll = async (redis) => {
  const raw = await redis.get(KEY)
  if (!raw) return []
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

const saveAll = async (redis, requests) => {
  await redis.set(KEY, JSON.stringify(requests))
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-requests', traceId, env)
  const headers = { ...CORS_HEADERS, 'X-Trace-Id': traceId }
  const isAdmin = request.headers.get('x-admin-secret') === env.ADMIN_SECRET

  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })

  if (request.method === 'GET') {
    if (!isAdmin) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })
    try {
      const requests = await getAll(redis)
      log.info('Requests fetched', { count: requests.length })
      return Response.json({ ok: true, requests }, { status: 200, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { traceId } })
      Sentry.metrics.count('requests.error', 1, { tags: { operation: 'fetch' } })
      log.error('Failed to fetch requests', { message: err.message })
      return Response.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500, headers })
    }
  }

  if (request.method === 'POST') {
    let reqBody
    try { reqBody = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

    try {
      if (!reqBody?.id || !reqBody?.email) {
        return Response.json({ ok: false, error: 'Invalid request payload' }, { status: 400, headers })
      }
      const requests = await getAll(redis)
      if (requests.some(r => r.id === reqBody.id)) {
        return Response.json({ ok: true, message: 'Already exists' }, { status: 200, headers })
      }
      await saveAll(redis, [reqBody, ...requests])
      Sentry.metrics.count('requests.created', 1, { tags: { need: reqBody.need ?? 'unknown' } })
      log.info('Project request created', { id: reqBody.id, need: reqBody.need })
      return Response.json({ ok: true }, { status: 201, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { traceId } })
      Sentry.metrics.count('requests.error', 1, { tags: { operation: 'create' } })
      log.error('Failed to create request', { message: err.message })
      return Response.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500, headers })
    }
  }

  if (request.method === 'PUT') {
    if (!isAdmin) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })
    let body
    try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

    try {
      const { requests } = body || {}
      if (!Array.isArray(requests)) return Response.json({ ok: false, error: 'requests array required' }, { status: 400, headers })
      await saveAll(redis, requests)
      log.info('Requests bulk updated', { count: requests.length })
      return Response.json({ ok: true }, { status: 200, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { traceId } })
      Sentry.metrics.count('requests.error', 1, { tags: { operation: 'bulk_update' } })
      log.error('Failed to bulk update requests', { message: err.message })
      return Response.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500, headers })
    }
  }

  if (request.method === 'DELETE') {
    if (!isAdmin) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })
    let body
    try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

    try {
      const { id } = body || {}
      if (!id) return Response.json({ ok: false, error: 'id required' }, { status: 400, headers })
      const requests = await getAll(redis)
      await saveAll(redis, requests.filter(r => r.id !== id))
      log.info('Request deleted', { id })
      return Response.json({ ok: true }, { status: 200, headers })
    } catch (err) {
      Sentry.captureException(err, { extra: { traceId } })
      Sentry.metrics.count('requests.error', 1, { tags: { operation: 'delete' } })
      log.error('Failed to delete request', { message: err.message })
      return Response.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500, headers })
    }
  }

  return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })
}
