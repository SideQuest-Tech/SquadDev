import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password are required' })

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const raw = await redis.get(`client:${normalizedEmail}`)
    if (!raw) return res.status(401).json({ ok: false, error: 'Invalid email or password' })

    const record = typeof raw === 'string' ? JSON.parse(raw) : raw

    if (!record.isActive) return res.status(403).json({ ok: false, error: 'Account suspended. Please contact SideQuest Tech.' })

    const match = await bcrypt.compare(password, record.passwordHash)
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid email or password' })

    const token = jwt.sign(
      {
        sub: normalizedEmail,
        name: record.fullName,
        company: record.company,
        folderId: record.clickupFolderId,
        mustChangePassword: record.mustChangePassword
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(200).json({
      ok: true,
      token,
      client: {
        name: record.fullName,
        company: record.company,
        folderId: record.clickupFolderId,
        mustChangePassword: record.mustChangePassword
      }
    })
  } catch (err) {
    console.error('[client-login]', err)
    return res.status(500).json({ ok: false, error: 'Login failed. Please try again.' })
  }
}
