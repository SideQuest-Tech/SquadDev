import { Redis } from '@upstash/redis'
import { createLogger } from './_logger.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const KEY = 'sidequest_requests'
const isAdmin = req => req.headers['x-admin-secret'] === process.env.ADMIN_SECRET

const getAll = async () => {
  const raw = await redis.get(KEY)
  if (!raw) return []
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

const saveAll = async (requests) => {
  await redis.set(KEY, JSON.stringify(requests))
}

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-requests', traceId)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('X-Trace-Id', traceId)

  if (req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    try {
      const requests = await getAll()
      log.info('Requests fetched', { count: requests.length })
      return res.status(200).json({ ok: true, requests })
    } catch (err) {
      log.error('Failed to fetch requests', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  if (req.method === 'POST') {
    try {
      const request = req.body
      if (!request?.id || !request?.email) {
        return res.status(400).json({ ok: false, error: 'Invalid request payload' })
      }
      const requests = await getAll()
      if (requests.some(r => r.id === request.id)) {
        return res.status(200).json({ ok: true, message: 'Already exists' })
      }
      await saveAll([request, ...requests])
      log.info('Project request created', { id: request.id, need: request.need })
      return res.status(201).json({ ok: true })
    } catch (err) {
      log.error('Failed to create request', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    try {
      const { requests } = req.body || {}
      if (!Array.isArray(requests)) return res.status(400).json({ ok: false, error: 'requests array required' })
      await saveAll(requests)
      log.info('Requests bulk updated', { count: requests.length })
      return res.status(200).json({ ok: true })
    } catch (err) {
      log.error('Failed to bulk update requests', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    try {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ ok: false, error: 'id required' })
      const requests = await getAll()
      await saveAll(requests.filter(r => r.id !== id))
      log.info('Request deleted', { id })
      return res.status(200).json({ ok: true })
    } catch (err) {
      log.error('Failed to delete request', { message: err.message })
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
