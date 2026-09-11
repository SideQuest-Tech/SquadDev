import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRedis = {
  data: new Map(),
  get: vi.fn((key) => Promise.resolve(mockRedis.data.get(key) ?? null)),
  set: vi.fn((key, value) => { mockRedis.data.set(key, value); return Promise.resolve('OK') })
}

const mockResend = {
  emails: { send: vi.fn().mockResolvedValue({ id: 'email-123' }) }
}

vi.mock('@upstash/redis', () => ({ Redis: vi.fn(() => mockRedis) }))
vi.mock('resend', () => ({ Resend: vi.fn(() => mockResend) }))
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
    compare: vi.fn(() => Promise.resolve(true))
  }
}))

const activeClient = {
  email: 'jane@example.com',
  passwordHash: 'hashed_oldpassword',
  fullName: 'Jane Doe',
  company: 'Acme Corp',
  clickupFolderId: 'folder-1',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  mustChangePassword: false
}

const makeReq = (body, method = 'POST') => ({
  method,
  headers: {},
  body
})

const makeRes = () => ({
  setHeader: vi.fn(),
  status: vi.fn().mockReturnThis(),
  json: vi.fn()
})

describe('forgot-password API endpoint', () => {
  let handler

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRedis.data.clear()
    const module = await import('../api/forgot-password.js')
    handler = module.default
  })

  describe('Happy path — known active client', () => {
    it('generates a temp password, updates Redis, sends email, returns ok', async () => {
      mockRedis.data.set('client:jane@example.com', JSON.stringify(activeClient))

      const res = makeRes()
      await handler(makeReq({ email: 'jane@example.com' }), res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ ok: true })

      // Redis record updated with new password hash
      const setCall = mockRedis.set.mock.calls.find(c => c[0] === 'client:jane@example.com')
      expect(setCall).toBeTruthy()
      const stored = JSON.parse(setCall[1])
      expect(stored.passwordHash).toMatch(/^hashed_SQT-/)

      // Other fields preserved
      expect(stored.fullName).toBe('Jane Doe')
      expect(stored.isActive).toBe(true)
      expect(stored.mustChangePassword).toBe(false)

      // Email sent with temp password
      expect(mockResend.emails.send).toHaveBeenCalledOnce()
      const emailCall = mockResend.emails.send.mock.calls[0][0]
      expect(emailCall.to).toBe('jane@example.com')
      expect(emailCall.subject).toBe('Your temporary password')
      expect(emailCall.html).toContain('Temporary password')
      expect(emailCall.html).toContain('Jane Doe')
    })

    it('normalises email to lowercase before lookup', async () => {
      mockRedis.data.set('client:jane@example.com', JSON.stringify(activeClient))

      const res = makeRes()
      await handler(makeReq({ email: 'JANE@EXAMPLE.COM' }), res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(mockResend.emails.send).toHaveBeenCalledOnce()
    })

    it('does not set mustChangePassword on the stored record', async () => {
      mockRedis.data.set('client:jane@example.com', JSON.stringify(activeClient))

      const res = makeRes()
      await handler(makeReq({ email: 'jane@example.com' }), res)

      const setCall = mockRedis.set.mock.calls.find(c => c[0] === 'client:jane@example.com')
      const stored = JSON.parse(setCall[1])
      expect(stored.mustChangePassword).toBe(false)
    })
  })

  describe('Security — unknown or inactive accounts', () => {
    it('returns ok without sending email for unknown email', async () => {
      const res = makeRes()
      await handler(makeReq({ email: 'nobody@example.com' }), res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ ok: true })
      expect(mockResend.emails.send).not.toHaveBeenCalled()
      expect(mockRedis.set).not.toHaveBeenCalled()
    })

    it('returns ok without sending email for inactive client', async () => {
      mockRedis.data.set('client:jane@example.com', JSON.stringify({ ...activeClient, isActive: false }))

      const res = makeRes()
      await handler(makeReq({ email: 'jane@example.com' }), res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ ok: true })
      expect(mockResend.emails.send).not.toHaveBeenCalled()
      expect(mockRedis.set).not.toHaveBeenCalled()
    })
  })

  describe('Input validation', () => {
    it('returns 400 when email is missing', async () => {
      const res = makeRes()
      await handler(makeReq({}), res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }))
    })

    it('returns 405 for non-POST methods', async () => {
      const res = makeRes()
      await handler(makeReq({}, 'GET'), res)

      expect(res.status).toHaveBeenCalledWith(405)
    })
  })

  describe('Error handling', () => {
    it('returns 500 when Redis throws', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis down'))

      const res = makeRes()
      await handler(makeReq({ email: 'jane@example.com' }), res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }))
    })

    it('returns 500 when Resend throws', async () => {
      mockRedis.data.set('client:jane@example.com', JSON.stringify(activeClient))
      mockResend.emails.send.mockRejectedValueOnce(new Error('Resend down'))

      const res = makeRes()
      await handler(makeReq({ email: 'jane@example.com' }), res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }))
    })
  })
})
