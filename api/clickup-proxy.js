import jwt from 'jsonwebtoken'
import { createLogger } from './_logger.js'

const CLICKUP_BASE = 'https://api.clickup.com/api/v2'

const ALLOWED_PATHS = [
  /^\/folder\/[^/]+\/list$/,
  /^\/list\/[^/]+\/task$/,
  /^\/task\/[^/]+\/comment$/,
  /^\/task\/[^/]+\/attachment$/,
  /^\/folder\/[^/]+$/
]

const isAllowedPath = path => ALLOWED_PATHS.some(r => r.test(path.split('?')[0]))

const extractFolderIdFromPath = path => {
  const m = path.match(/\/folder\/([^/]+)/)
  return m ? m[1] : null
}

export default async function handler(req, res) {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log = createLogger('fn-clickup-proxy', traceId)
  res.setHeader('X-Trace-Id', traceId)

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'Authorization required' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }

  const { method = 'GET', path, body, query } = req.body || {}
  if (!path) return res.status(400).json({ ok: false, error: 'path is required' })
  if (!isAllowedPath(path)) return res.status(403).json({ ok: false, error: 'Path not permitted' })

  // Scope check: folder paths must match the client's folderId from JWT
  const pathFolderId = extractFolderIdFromPath(path)
  if (pathFolderId && pathFolderId !== payload.folderId) {
    return res.status(403).json({ ok: false, error: 'Access denied to this resource' })
  }

  try {
    const qs = query ? '?' + new URLSearchParams(query).toString() : ''
    let fetchOptions = {
      method,
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }

    // Handle attachment uploads (base64 → multipart)
    if (path.includes('/attachment') && method === 'POST' && body?.base64) {
      const binaryStr = atob(body.base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      const formData = new FormData()
      formData.append('attachment', new Blob([bytes], { type: body.mimeType || 'application/octet-stream' }), body.filename || 'upload')
      fetchOptions = {
        method: 'POST',
        headers: { Authorization: process.env.CLICKUP_API_TOKEN },
        body: formData
      }
    } else if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    const upstream = await fetch(`${CLICKUP_BASE}${path}${qs}`, fetchOptions)
    const data = await upstream.json()
    log.info('ClickUp proxied', { method, path: path.split('?')[0], status: upstream.status })
    return res.status(upstream.status).json(data)
  } catch (err) {
    log.error('ClickUp proxy error', { message: err.message })
    return res.status(500).json({ ok: false, error: 'Request failed. Please try again.' })
  }
}
