import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})
const resend = new Resend(process.env.RESEND_API_KEY)

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

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return 'SQT-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const { requestId, fullName, email, company, projectName } = req.body || {}
  if (!fullName || !email || !company || !projectName) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: fullName, email, company, projectName' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const clientKey = `client:${normalizedEmail}`

  try {
    // Check if client already exists and is active
    const existing = parseObj(await redis.get(clientKey))
    if (existing && existing.isActive) {
      return res.status(409).json({ ok: false, error: 'Client account already exists and is active' })
    }

    // Create or reuse ClickUp folder for this client
    let folderId = existing?.clickupFolderId
    if (!folderId) {
      const folderRes = await clickup(`/space/${process.env.CLICKUP_SPACE_ID}/folder`, {
        method: 'POST',
        body: JSON.stringify({ name: company })
      })
      if (!folderRes.id) {
        console.error('[admin-approve] ClickUp folder creation failed', folderRes)
        return res.status(500).json({ ok: false, error: 'Failed to create project folder. Check ClickUp configuration.' })
      }
      folderId = folderRes.id
    }

    // Create ClickUp list for this project
    const listRes = await clickup(`/folder/${folderId}/list`, {
      method: 'POST',
      body: JSON.stringify({ name: projectName })
    })
    if (!listRes.id) {
      console.error('[admin-approve] ClickUp list creation failed', listRes)
      return res.status(500).json({ ok: false, error: 'Failed to create project list. Check ClickUp configuration.' })
    }
    const listId = listRes.id

    // Generate credentials
    const tempPassword = generatePassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Write client record
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

    // Write project record
    const projectRecord = {
      listId,
      listName: projectName,
      clientEmail: normalizedEmail,
      folderId,
      projectStatus: 'in_progress',
      pauseReason: null,
      archivedAt: null,
      createdAt: new Date().toISOString()
    }
    await redis.set(`project:${listId}`, JSON.stringify(projectRecord))

    // Update indexes
    const approvedClients = parseArr(await redis.get('approved_clients'))
    if (!approvedClients.includes(normalizedEmail)) {
      approvedClients.push(normalizedEmail)
      await redis.set('approved_clients', JSON.stringify(approvedClients))
    }

    const clientProjects = parseArr(await redis.get(`client_projects:${normalizedEmail}`))
    clientProjects.push(listId)
    await redis.set(`client_projects:${normalizedEmail}`, JSON.stringify(clientProjects))

    // Send welcome email
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

    return res.status(200).json({ ok: true, tempPassword, folderId, listId })
  } catch (err) {
    console.error('[admin-approve]', err)
    return res.status(500).json({ ok: false, error: 'Approval failed. Please try again.' })
  }
}
