import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

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

const CLICKUP_BASE = 'https://api.clickup.com/api/v2'
const clickup = (path, options = {}) =>
  fetch(`${CLICKUP_BASE}${path}`, {
    ...options,
    headers: { Authorization: process.env.CLICKUP_API_TOKEN, 'Content-Type': 'application/json', ...options.headers }
  }).then(r => r.json())

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const { email } = req.query || {}
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

      return res.status(200).json({ ok: true, projects: projects.filter(Boolean) })
    } catch (err) {
      console.error('[projects GET]', err)
      return res.status(500).json({ ok: false, error: 'Failed to load projects.' })
    }
  }

  if (req.method === 'POST') {
    const { action, listId, newStatus, pauseReason } = req.body || {}
    if (!action || !listId) return res.status(400).json({ ok: false, error: 'action and listId are required' })

    try {
      const raw = await redis.get(`project:${listId}`)
      if (!raw) return res.status(404).json({ ok: false, error: 'Project not found' })
      const project = parseObj(raw)

      if (action === 'update-status') {
        if (!newStatus) return res.status(400).json({ ok: false, error: 'newStatus is required' })
        const validStatuses = ['in_progress', 'paused', 'cancelled', 'completed']
        if (!validStatuses.includes(newStatus)) {
          return res.status(400).json({ ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
        }

        const updates = { projectStatus: newStatus }

        if (newStatus === 'paused') {
          updates.pauseReason = pauseReason || 'Project temporarily on hold'
        } else if (newStatus === 'in_progress') {
          updates.pauseReason = null
        } else if (newStatus === 'cancelled' || newStatus === 'completed') {
          updates.archivedAt = new Date().toISOString()
          updates.pauseReason = null
          // Archive the ClickUp list
          await clickup(`/list/${listId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: true })
          })
        }

        await redis.set(`project:${listId}`, JSON.stringify({ ...project, ...updates }))
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
    } catch (err) {
      console.error('[projects POST]', err)
      return res.status(500).json({ ok: false, error: 'Action failed. Please try again.' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
