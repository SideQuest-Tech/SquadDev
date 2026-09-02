import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import crypto from 'crypto'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const resend = new Resend(process.env.RESEND_API_KEY)

const parseObj = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email } = req.body || {}
  if (!email) return res.status(400).json({ ok: false, error: 'Email is required' })

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // Check if client exists
    const client = parseObj(await redis.get(`client:${normalizedEmail}`))
    
    // Always return success to prevent email enumeration attacks
    // But only send email if client actually exists
    if (client && client.isActive) {
      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const tokenKey = `reset_token:${resetToken}`
      
      // Store token in Redis with 1 hour expiration
      await redis.set(tokenKey, JSON.stringify({
        email: normalizedEmail,
        createdAt: new Date().toISOString()
      }), { ex: 3600 }) // 3600 seconds = 1 hour
      
      // Build reset link
      const resetLink = `${process.env.BASE_URL || 'https://www.sidequesttech.co.za'}?reset=${resetToken}`
      
      // Send password reset email
      await resend.emails.send({
        from: 'SideQuest Tech <hello@sidequesttech.co.za>',
        to: normalizedEmail,
        subject: 'Reset your password',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2a3a">
            <h2 style="margin-bottom:4px">Password Reset Request</h2>
            <p>Hi ${client.fullName},</p>
            <p>We received a request to reset the password for your SideQuest Tech client portal account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#2676ff;color:white;border-radius:7px;text-decoration:none;font-weight:700">Reset Password</a>
            <p style="font-size:13px;color:#697487">Or copy and paste this link into your browser:</p>
            <p style="font-size:12px;color:#8994a3;word-break:break-all">${resetLink}</p>
            <p style="margin-top:32px;font-size:13px;color:#697487">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p style="margin-top:28px;color:#8994a3;font-size:12px">SideQuest Tech · hello@sidequesttech.co.za</p>
          </div>
        `
      })
    }
    
    // Always return success (security best practice)
    return res.status(200).json({ 
      ok: true, 
      message: 'If an account exists with this email, you will receive a password reset link shortly.' 
    })
  } catch (err) {
    console.error('[forgot-password]', err)
    return res.status(500).json({ ok: false, error: 'Failed to process request. Please try again.' })
  }
}
