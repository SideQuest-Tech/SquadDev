import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const parseObj = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { token, newPassword } = req.body || {}
  
  if (!token || !newPassword) {
    return res.status(400).json({ ok: false, error: 'Token and new password are required' })
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' })
  }

  const tokenKey = `reset_token:${token}`

  try {
    // Retrieve token data
    const tokenData = parseObj(await redis.get(tokenKey))
    
    if (!tokenData) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid or expired reset link. Please request a new password reset.' 
      })
    }

    const { email } = tokenData
    const clientKey = `client:${email}`

    // Get client record
    const client = parseObj(await redis.get(clientKey))
    
    if (!client || !client.isActive) {
      return res.status(404).json({ ok: false, error: 'Client account not found' })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update client record with new password
    const updatedClient = {
      ...client,
      passwordHash,
      mustChangePassword: false, // Reset this flag in case it was set
      passwordLastChanged: new Date().toISOString()
    }

    await redis.set(clientKey, JSON.stringify(updatedClient))

    // Delete the used token
    await redis.del(tokenKey)

    return res.status(200).json({ 
      ok: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    })
  } catch (err) {
    console.error('[reset-password]', err)
    return res.status(500).json({ ok: false, error: 'Failed to reset password. Please try again.' })
  }
}
