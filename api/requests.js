import { Redis } from '@upstash/redis'

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
  res.setHeader('Access-Control-Allow-Origin', '*')

  // GET — list all requests (admin only)
  if (req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    try {
      const requests = await getAll()
      return res.status(200).json({ ok: true, requests })
    } catch (err) {
      console.error('[requests GET]', err)
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  // POST — create a new request (public — form submission)
  if (req.method === 'POST') {
    try {
      const request = req.body
      if (!request?.id || !request?.email) {
        return res.status(400).json({ ok: false, error: 'Invalid request payload' })
      }
      const requests = await getAll()
      // Prevent duplicates
      if (requests.some(r => r.id === request.id)) {
        return res.status(200).json({ ok: true, message: 'Already exists' })
      }
      await saveAll([request, ...requests])
      return res.status(201).json({ ok: true })
    } catch (err) {
      console.error('[requests POST]', err)
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  // PUT — replace the full requests array (admin only — used by dashboard saves)
  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    try {
      const { requests } = req.body || {}
      if (!Array.isArray(requests)) return res.status(400).json({ ok: false, error: 'requests array required' })
      await saveAll(requests)
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[requests PUT]', err)
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  // DELETE — remove one request by id (admin only)
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    try {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ ok: false, error: 'id required' })
      const requests = await getAll()
      await saveAll(requests.filter(r => r.id !== id))
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[requests DELETE]', err)
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
