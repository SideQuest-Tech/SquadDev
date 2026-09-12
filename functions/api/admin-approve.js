import { Redis } from '@upstash/redis/cloudflare'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
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

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return 'SQT-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function onRequest({ request, env }) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const log = createLogger('fn-admin-approve', traceId, env)
  const headers = { 'X-Trace-Id': traceId }

  if (request.method !== 'POST') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers })

  if (!await verifyAdminToken(request, env)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers })
  }

  let body
  try { body = await request.json() } catch { return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers }) }

  const { requestId, fullName, email, company, projectName } = body || {}
  if (!fullName || !email || !company || !projectName) {
    return Response.json({ ok: false, error: 'Missing required fields: fullName, email, company, projectName' }, { status: 400, headers })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const clientKey = `client:${normalizedEmail}`
  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
  const resend = new Resend(env.RESEND_API_KEY)

  try {
    const existing = parseObj(await redis.get(clientKey))
    const isExistingClient = !!(existing && existing.isActive)

    let folderId = existing?.clickupFolderId
    if (!folderId) {
      const folderRes = await clickup(`/space/${env.CLICKUP_SPACE_ID}/folder`, {
        method: 'POST',
        body: JSON.stringify({ name: company })
      }, env)
      if (!folderRes.id) {
        Sentry.metrics.count('admin_approve.clickup_failed', 1, { tags: { operation: 'create_folder' } })
        log.error('ClickUp folder creation failed', { response: folderRes.err || 'no id returned' })
        return Response.json({ ok: false, error: 'Failed to create project folder. Check ClickUp configuration.' }, { status: 500, headers })
      }
      folderId = folderRes.id
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const uniqueSuffix = `${year}${month}-${timestamp}${random}`
    const uniqueProjectName = `${projectName} [${uniqueSuffix}]`

    const listRes = await clickup(`/folder/${folderId}/list`, {
      method: 'POST',
      body: JSON.stringify({ name: uniqueProjectName })
    }, env)
    if (!listRes.id) {
      Sentry.metrics.count('admin_approve.clickup_failed', 1, { tags: { operation: 'create_list' } })
      log.error('ClickUp list creation failed', { folderId, response: listRes.err || 'no id returned' })
      return Response.json({ ok: false, error: 'Failed to create project list. Check ClickUp configuration.' }, { status: 500, headers })
    }
    const listId = listRes.id

    let tempPassword = null
    let passwordHash = existing?.passwordHash

    if (!isExistingClient) {
      tempPassword = generatePassword()
      passwordHash = await bcrypt.hash(tempPassword, 12)
      const clientRecord = {
        email: normalizedEmail,
        passwordHash,
        fullName,
        company,
        clickupFolderId: folderId,
        isActive: true,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
        requestId: requestId || null
      }
      await redis.set(clientKey, JSON.stringify(clientRecord))
    }

    const projectRecord = {
      listId,
      listName: uniqueProjectName,
      clientEmail: normalizedEmail,
      folderId,
      projectStatus: 'in_progress',
      pauseReason: null,
      archivedAt: null,
      createdAt: new Date().toISOString()
    }
    await redis.set(`project:${listId}`, JSON.stringify(projectRecord))

    const approvedClients = parseArr(await redis.get('approved_clients'))
    if (!approvedClients.includes(normalizedEmail)) {
      approvedClients.push(normalizedEmail)
      await redis.set('approved_clients', JSON.stringify(approvedClients))
    }

    const clientProjects = parseArr(await redis.get(`client_projects:${normalizedEmail}`))
    clientProjects.push(listId)
    await redis.set(`client_projects:${normalizedEmail}`, JSON.stringify(clientProjects))

    if (isExistingClient) {
      await resend.emails.send({
        from: 'SideQuest Tech <hello@sidequesttech.co.za>',
        to: normalizedEmail,
        subject: `New project added: ${projectName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2a3a">
            <h2 style="margin-bottom:4px">Hi ${fullName},</h2>
            <p>Great news! A new project <strong>${projectName}</strong> has been added to your account.</p>
            <p>You can access it now in your client portal using your existing login credentials.</p>
            <a href="https://www.sidequesttech.co.za" style="display:inline-block;margin-top:8px;padding:11px 22px;background:#2676ff;color:white;border-radius:7px;text-decoration:none;font-weight:700">View Project</a>
            <p style="margin-top:28px;color:#8994a3;font-size:12px">SideQuest Tech · hello@sidequesttech.co.za</p>
          </div>
        `
      })
    } else {
      await resend.emails.send({
        from: 'SideQuest Tech <hello@sidequesttech.co.za>',
        to: normalizedEmail,
        subject: `Your ${company} project portal is ready`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2a3a">
            <h2 style="margin-bottom:4px">Hi ${fullName},</h2>
            <p>Your project <strong>${projectName}</strong> has been approved and your client portal is ready.</p>
            <p>Sign in with these credentials:</p>
            <div style="background:#f3f6fa;border-radius:8px;padding:16px 20px;margin:20px 0">
              <p style="margin:0 0 6px"><strong>Email:</strong> ${normalizedEmail}</p>
              <p style="margin:0"><strong>Temporary password:</strong> ${tempPassword}</p>
            </div>
            <p>You will be asked to change your password on first login.</p>
            <a href="https://www.sidequesttech.co.za" style="display:inline-block;margin-top:8px;padding:11px 22px;background:#2676ff;color:white;border-radius:7px;text-decoration:none;font-weight:700">Open Client Portal</a>
            <p style="margin-top:28px;color:#8994a3;font-size:12px">SideQuest Tech · hello@sidequesttech.co.za</p>
          </div>
        `
      })
    }

    Sentry.metrics.count('admin_approve.success', 1, { tags: { existing: String(isExistingClient) } })
    log.info('Client approved', { listId, folderId, isExistingClient })
    return Response.json({ ok: true, tempPassword: isExistingClient ? null : tempPassword, folderId, listId, isExistingClient }, { status: 200, headers })
  } catch (err) {
    Sentry.captureException(err, { extra: { traceId } })
    Sentry.metrics.count('admin_approve.error', 1)
    log.error('Approval failed', { message: err.message })
    return Response.json({ ok: false, error: 'Approval failed. Please try again.' }, { status: 500, headers })
  }
}
