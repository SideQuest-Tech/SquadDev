import jwt from 'jsonwebtoken'
import { createLogger } from '../_shared/logger.js'

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

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-clickup-proxy', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (request.method !== 'POST') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return Response.json({ ok: false, error: 'Authorization required' }, { status: 401, headers })

  let payload
  try {
    payload = jwt.verify(token, env.JWT_SECRET)
  } catch {
    return Response.json({ ok: false, error: 'Invalid or expired token' }, { status: 401, headers })
  }

  let body
  try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

  const { method = 'GET', path, body: reqBody, query } = body || {}
  if (!path) return Response.json({ ok: false, error: 'path is required' }, { status: 400, headers })
  if (!isAllowedPath(path)) return Response.json({ ok: false, error: 'Path not permitted' }, { status: 403, headers })

  // Scope check: folder paths must match the client's folderId from JWT
  const pathFolderId = extractFolderIdFromPath(path)
  if (pathFolderId && pathFolderId !== payload.folderId) {
    return Response.json({ ok: false, error: 'Access denied to this resource' }, { status: 403, headers })
  }

  try {
    const qs = query ? '?' + new URLSearchParams(query).toString() : ''
    let fetchOptions = {
      method,
      headers: {
        Authorization: env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }

    // Handle attachment uploads (base64 → multipart)
    if (path.includes('/attachment') && method === 'POST' && reqBody?.base64) {
      const binaryStr = atob(reqBody.base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      const formData = new FormData()
      formData.append('attachment', new Blob([bytes], { type: reqBody.mimeType || 'application/octet-stream' }), reqBody.filename || 'upload')
      fetchOptions = {
        method: 'POST',
        headers: { Authorization: env.CLICKUP_API_TOKEN },
        body: formData
      }
    } else if (reqBody && method !== 'GET') {
      fetchOptions.body = JSON.stringify(reqBody)
    }

    const upstream = await fetch(`${CLICKUP_BASE}${path}${qs}`, fetchOptions)
    const data = await upstream.json()
    log.info('ClickUp proxied', { method, path: path.split('?')[0], status: upstream.status })
    return Response.json(data, { status: upstream.status, headers })
  } catch (err) {
    log.error('ClickUp proxy error', { message: err.message })
    return Response.json({ ok: false, error: 'Request failed. Please try again.' }, { status: 500, headers })
  }
}
