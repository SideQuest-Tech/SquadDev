import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// Mock Redis and Resend
const mockRedis = {
  data: new Map(),
  get: vi.fn((key) => Promise.resolve(mockRedis.data.get(key) || null)),
  set: vi.fn((key, value, options) => {
    mockRedis.data.set(key, value)
    // Store expiration info if provided
    if (options?.ex) {
      mockRedis.data.set(`${key}:expiry`, Date.now() + options.ex * 1000)
    }
    return Promise.resolve('OK')
  }),
  del: vi.fn((key) => {
    mockRedis.data.delete(key)
    return Promise.resolve(1)
  })
}

const mockResend = {
  emails: {
    send: vi.fn().mockResolvedValue({ id: 'email-test-id' })
  }
}

// Mock crypto for deterministic token generation in tests
let mockTokenCounter = 0
vi.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
  mockTokenCounter++
  return Buffer.from(`test-token-${mockTokenCounter}`.padEnd(size * 2, '0'))
})

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedis)
}))

vi.mock('resend', () => ({
  Resend: vi.fn(() => mockResend)
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
    compare: vi.fn(() => Promise.resolve(true))
  }
}))

describe('Password Reset Flow', () => {
  let forgotPasswordHandler, resetPasswordHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRedis.data.clear()
    mockTokenCounter = 0
    
    const forgotModule = await import('../api/forgot-password.js')
    const resetModule = await import('../api/reset-password.js')
    forgotPasswordHandler = forgotModule.default
    resetPasswordHandler = resetModule.default
  })

  describe('Forgot Password API', () => {
    it('should send reset email for existing active client', async () => {
      // Setup existing client
      const clientEmail = 'john@example.com'
      const clientData = JSON.stringify({
        email: clientEmail,
        passwordHash: 'hashed_oldpassword123',
        fullName: 'John Doe',
        company: 'Test Corp',
        isActive: true
      })
      mockRedis.data.set(`client:${clientEmail}`, clientData)

      const req = {
        method: 'POST',
        body: { email: clientEmail }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await forgotPasswordHandler(req, res)

      // Verify success response
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          message: expect.stringContaining('If an account exists')
        })
      )

      // Verify reset token was stored in Redis
      const tokenSetCall = mockRedis.set.mock.calls.find(call => 
        call[0].startsWith('reset_token:')
      )
      expect(tokenSetCall).toBeTruthy()
      expect(tokenSetCall[2]).toEqual({ ex: 3600 }) // 1 hour expiration

      // Verify email was sent
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: clientEmail,
          subject: 'Reset your password',
          html: expect.stringContaining('Password Reset Request')
        })
      )
    })

    it('should return success even for non-existent email (security)', async () => {
      const req = {
        method: 'POST',
        body: { email: 'nonexistent@example.com' }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await forgotPasswordHandler(req, res)

      // Should return success to prevent email enumeration
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ ok: true })
      )

      // But should NOT send email
      expect(mockResend.emails.send).not.toHaveBeenCalled()
    })

    it('should return error for missing email', async () => {
      const req = {
        method: 'POST',
        body: {}
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await forgotPasswordHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: 'Email is required'
        })
      )
    })

    it('should not send email for inactive client', async () => {
      const clientEmail = 'inactive@example.com'
      const clientData = JSON.stringify({
        email: clientEmail,
        isActive: false,
        fullName: 'Inactive User'
      })
      mockRedis.data.set(`client:${clientEmail}`, clientData)

      const req = {
        method: 'POST',
        body: { email: clientEmail }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await forgotPasswordHandler(req, res)

      // Returns success but doesn't send email
      expect(res.status).toHaveBeenCalledWith(200)
      expect(mockResend.emails.send).not.toHaveBeenCalled()
    })
  })

  describe('Reset Password API', () => {
    it('should reset password with valid token', async () => {
      const clientEmail = 'john@example.com'
      const resetToken = 'test-token-1'
      
      // Setup client
      const clientData = JSON.stringify({
        email: clientEmail,
        passwordHash: 'hashed_oldpassword',
        fullName: 'John Doe',
        isActive: true
      })
      mockRedis.data.set(`client:${clientEmail}`, clientData)

      // Setup reset token
      const tokenData = JSON.stringify({
        email: clientEmail,
        createdAt: new Date().toISOString()
      })
      mockRedis.data.set(`reset_token:${resetToken}`, tokenData)

      const req = {
        method: 'POST',
        body: {
          token: resetToken,
          newPassword: 'newsecurepass123'
        }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await resetPasswordHandler(req, res)

      // Verify success
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          message: expect.stringContaining('reset successfully')
        })
      )

      // Verify password was updated
      const updatedClient = JSON.parse(mockRedis.data.get(`client:${clientEmail}`))
      expect(updatedClient.passwordHash).toBe('hashed_newsecurepass123')
      expect(updatedClient.mustChangePassword).toBe(false)
      expect(updatedClient.passwordLastChanged).toBeTruthy()

      // Verify token was deleted
      expect(mockRedis.del).toHaveBeenCalledWith(`reset_token:${resetToken}`)
    })

    it('should reject invalid or expired token', async () => {
      const req = {
        method: 'POST',
        body: {
          token: 'invalid-token-xyz',
          newPassword: 'newsecurepass123'
        }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await resetPasswordHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining('Invalid or expired')
        })
      )
    })

    it('should reject password shorter than 8 characters', async () => {
      const req = {
        method: 'POST',
        body: {
          token: 'test-token',
          newPassword: 'short'
        }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await resetPasswordHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining('at least 8 characters')
        })
      )
    })

    it('should return error if client account not found', async () => {
      const resetToken = 'test-token-orphan'
      
      // Setup token but no client
      const tokenData = JSON.stringify({
        email: 'nonexistent@example.com',
        createdAt: new Date().toISOString()
      })
      mockRedis.data.set(`reset_token:${resetToken}`, tokenData)

      const req = {
        method: 'POST',
        body: {
          token: resetToken,
          newPassword: 'newsecurepass123'
        }
      }
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await resetPasswordHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining('not found')
        })
      )
    })
  })

  describe('Complete Password Reset Flow', () => {
    it('should complete full flow: request → receive token → reset password', async () => {
      const clientEmail = 'complete@example.com'
      
      // Setup client
      const clientData = JSON.stringify({
        email: clientEmail,
        passwordHash: 'hashed_originalpassword',
        fullName: 'Complete Test',
        company: 'Test Inc',
        isActive: true,
        mustChangePassword: true
      })
      mockRedis.data.set(`client:${clientEmail}`, clientData)

      // Step 1: Request password reset
      const forgotReq = {
        method: 'POST',
        body: { email: clientEmail }
      }
      const forgotRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await forgotPasswordHandler(forgotReq, forgotRes)

      // Extract token from Redis
      const tokenKey = Array.from(mockRedis.data.keys()).find(k => k.startsWith('reset_token:'))
      expect(tokenKey).toBeTruthy()
      const resetToken = tokenKey.replace('reset_token:', '')

      // Step 2: Use token to reset password
      const resetReq = {
        method: 'POST',
        body: {
          token: resetToken,
          newPassword: 'brandnewpassword123'
        }
      }
      const resetRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await resetPasswordHandler(resetReq, resetRes)

      // Verify final state
      expect(resetRes.status).toHaveBeenCalledWith(200)
      
      const finalClient = JSON.parse(mockRedis.data.get(`client:${clientEmail}`))
      expect(finalClient.passwordHash).toBe('hashed_brandnewpassword123')
      expect(finalClient.mustChangePassword).toBe(false)
      
      // Token should be deleted
      expect(mockRedis.data.has(tokenKey)).toBe(false)
    })
  })
})
