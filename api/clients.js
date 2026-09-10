import { Redis } from '@upstash/redis'
import { createLogger } from './_logger.js'

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
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-clients', traceId)

  res.setHeader('X-Trace-Id', traceId)

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
      const result = clients.filter(Boolean)
      log.info('Clients fetched', { count: result.length })
      return res.status(200).json({ ok: true, clients: result })
    } catch (err) {
      log.error('Failed to fetch clients', { message: err.message })
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
        if (record.clickupFolderId) {
          await clickup(`/folder/${record.clickupFolderId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: true })
          })
        }
        log.info('Client deactivated', { company: record.company })
        return res.status(200).json({ ok: true })
      }

      if (action === 'reactivate') {
        await redis.set(clientKey, JSON.stringify({ ...record, isActive: true }))
        if (record.clickupFolderId) {
          await clickup(`/folder/${record.clickupFolderId}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: false })
          })
        }
        log.info('Client reactivated', { company: record.company })
        return res.status(200).json({ ok: true })
      }

      if (action === 'remove') {
        await redis.del(clientKey)
        const emails = parseArr(await redis.get('approved_clients'))
        await redis.set('approved_clients', JSON.stringify(emails.filter(e => e !== normalizedEmail)))
        log.info('Client removed', { company: record.company })
        return res.status(200).json({ ok: true })
      }

      if (action === 'add-project') {
        if (!projectName) return res.status(400).json({ ok: false, error: 'projectName is required' })
        const listRes = await clickup(`/folder/${record.clickupFolderId}/list`, {
          method: 'POST',
          body: JSON.stringify({ name: projectName })
        })
        if (!listRes.id) {
          log.error('ClickUp list creation failed', { response: JSON.stringify(listRes) })
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

        log.info('Project added to client', { listId: listRes.id, company: record.company })
        return res.status(200).json({ ok: true, listId: listRes.id })
      }

      return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
    } catch (err) {
      log.error('Client action failed', { action, message: err.message })
      return res.status(500).json({ ok: false, error: 'Action failed. Please try again.' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
