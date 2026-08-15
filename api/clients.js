import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const CLICKUP_BASE = 'https://api.clickup.com/api/v2'
const clickup = (path, options = {}) =>
  fetch(`${CLICKUP_BASE}${path}`, {
    ...options,
    headers: { Authorization: process.env.CLICKUP_API_TOKEN, 'Content-Type': 'application/json', ...options.headers }
  }).then(r => r.json())

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

export default async function handler(req, res) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
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
      return res.status(200).json({ ok: true, clients: clients.filter(Boolean) })
    } catch (err) {
      console.error('[clients GET]', err)
      return res.status(500).json({ ok: false, error: 'Failed to load clients.' })
    }
  }

  if (req.method === 'POST') {
    const { action, email, projectName } = req.body || {}
    if (!action || !email) return res.status(400).json({ ok: false, error: 'action and email are required' })

    const normalizedEmail = email.toLowerCase().trim()
    const clientKey = `client:${normalizedEmail}`

    try {
      const raw = await redis.get(clientKey)
      if (!raw) return res.status(404).json({ ok: false, error: 'Client not found' })
      const record = parseObj(raw)

      if (action === 'deactivate') {
        await redis.set(clientKey, JSON.stringify({ ...record, isActive: false }))
        // Archive the ClickUp folder
        if (record.clickupFolderId) {
          await clickup(`/folder/${record.clickupFolderId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: true })
          })
        }
        return res.status(200).json({ ok: true })
      }

      if (action === 'reactivate') {
        await redis.set(clientKey, JSON.stringify({ ...record, isActive: true }))
        // Unarchive the ClickUp folder
        if (record.clickupFolderId) {
          await clickup(`/folder/${record.clickupFolderId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: false })
          })
        }
        return res.status(200).json({ ok: true })
      }

      if (action === 'remove') {
        // Hard delete from Redis and remove from index
        await redis.del(clientKey)
        const emails = parseArr(await redis.get('approved_clients'))
        await redis.set('approved_clients', JSON.stringify(emails.filter(e => e !== normalizedEmail)))
        return res.status(200).json({ ok: true })
      }

      if (action === 'add-project') {
        if (!projectName) return res.status(400).json({ ok: false, error: 'projectName is required' })
        const listRes = await clickup(`/folder/${record.clickupFolderId}/list`, {
          method: 'POST',
          body: JSON.stringify({ name: projectName })
        })
        if (!listRes.id) {
        console.error('[clients add-project] ClickUp list creation failed', listRes)
        return res.status(500).json({ ok: false, error: 'Failed to create project list. Check ClickUp configuration.' })
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

        return res.status(200).json({ ok: true, listId: listRes.id })
      }

      return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
    } catch (err) {
      console.error('[clients POST]', err)
      return res.status(500).json({ ok: false, error: 'Action failed. Please try again.' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
