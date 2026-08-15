import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' })

  try {
    const raw = await redis.get('sidequest_admin')
    if (!raw) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    let record
    try {
      record = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (parseErr) {
      console.error('[admin-login] Malformed admin record in Redis. Raw value:', raw)
      return res.status(500).json({ ok: false, error: 'Admin record is malformed — re-set it in Upstash.' })
    }

    if (!record || record.email !== email.toLowerCase().trim()) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }
    const match = await bcrypt.compare(password, record.passwordHash)
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid credentials' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[admin-login]', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
