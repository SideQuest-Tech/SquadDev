import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock storage
const mockRedis = {
  data: new Map(),
  get: vi.fn((key) => Promise.resolve(mockRedis.data.get(key) || null)),
  set: vi.fn((key, value) => {
    mockRedis.data.set(key, value)
    return Promise.resolve('OK')
  })
}

const mockResend = {
  emails: {
    send: vi.fn().mockResolvedValue({ id: 'email-123' })
  }
}

let folderIdCounter = 1
let listIdCounter = 1

// Mock fetch for ClickUp API
global.fetch = vi.fn((url, options) => {
  // Folder creation: POST to /space/{id}/folder
  if (url.includes('/space/') && url.includes('/folder') && options?.method === 'POST') {
    return Promise.resolve({
      json: () => Promise.resolve({ id: `folder-${folderIdCounter++}` })
    })
  }
  // List creation: POST to /folder/{id}/list
  if (url.includes('/folder/') && url.includes('/list') && options?.method === 'POST') {
    return Promise.resolve({
      json: () => Promise.resolve({ id: `list-${listIdCounter++}` })
    })
  }
  return Promise.resolve({ json: () => Promise.resolve({}) })
})

// Mock modules before importing handler
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

describe('admin-approve API endpoint', () => {
  let handler

  beforeEach(async () => {
    // Reset all state
    vi.clearAllMocks()
    mockRedis.data.clear()
    folderIdCounter = 1
    listIdCounter = 1
    
    // Import handler after mocks are set up
    const module = await import('../api/admin-approve.js')
    handler = module.default
  })

  describe('New Client Approval', () => {
    it('should create new client account for first-time customer', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-admin-secret': 'test-admin-secret' },
        body: {
          requestId: 'req-123',
          fullName: 'John Doe',
          email: 'john@example.com',
          company: 'Test Company',
          projectName: 'Website Development'
        }
      }

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await handler(req, res)

      // Verify success response
      expect(res.status).toHaveBeenCalledWith(200)
      const response = res.json.mock.calls[0][0]
      expect(response.ok).toBe(true)
      expect(response.isExistingClient).toBe(false)
      expect(response.tempPassword).toMatch(/^SQT-/)

      // Verify client was created in Redis
      const clientKey = mockRedis.set.mock.calls.find(call => 
        call[0] === 'client:john@example.com'
      )
      expect(clientKey).toBeTruthy()

      // Verify project record with unique name
      const projectKey = mockRedis.set.mock.calls.find(call => 
        call[0].startsWith('project:')
      )
      expect(projectKey).toBeTruthy()
      const projectData = JSON.parse(projectKey[1])
      // Project name should have unique suffix like "Website Development [202609-123456ABCD]"
      expect(projectData.listName).toMatch(/^Website Development \[\d{6}-\d{6}[A-Z0-9]{4}\]$/)

      // Verify welcome email sent (uses clean project name without suffix)
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('project portal is ready'),
          html: expect.stringContaining('Temporary password')
        })
      )
    })
  })

  describe('Existing Client - Additional Project', () => {
    it('should add new project to existing client without creating duplicate', async () => {
      // Setup: existing client in Redis
      const existingClient = JSON.stringify({
        email: 'john@example.com',
        passwordHash: 'existing_hash_12345',
        fullName: 'John Doe',
        company: 'Test Company',
        clickupFolderId: 'folder-existing',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        mustChangePassword: false
      })

      mockRedis.data.set('client:john@example.com', existingClient)
      mockRedis.data.set('approved_clients', JSON.stringify(['john@example.com']))
      mockRedis.data.set('client_projects:john@example.com', JSON.stringify(['list-old-1']))

      const req = {
        method: 'POST',
        headers: { 'x-admin-secret': 'test-admin-secret' },
        body: {
          requestId: 'req-456',
          fullName: 'John Doe',
          email: 'john@example.com',
          company: 'Test Company',
          projectName: 'Mobile App Development'
        }
      }

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await handler(req, res)

      // Verify success
      expect(res.status).toHaveBeenCalledWith(200)
      const response = res.json.mock.calls[0][0]
      expect(response.ok).toBe(true)
      expect(response.isExistingClient).toBe(true)
      expect(response.tempPassword).toBeNull()

      // Verify "project added" email sent (not welcome email)
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'New project added: Mobile App Development',
          html: expect.stringContaining('existing login credentials')
        })
      )

      // Verify client_projects array was updated
      const projectsCall = mockRedis.set.mock.calls.find(call => 
        call[0] === 'client_projects:john@example.com'
      )
      expect(projectsCall).toBeTruthy()
      const projects = JSON.parse(projectsCall[1])
      expect(projects).toContain('list-old-1')
      expect(projects.length).toBeGreaterThan(1)
    })
  })

  describe('Error Handling', () => {
    it('should return 401 for missing admin secret', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-admin-secret': 'wrong-secret' },
        body: {}
      }

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          ok: false, 
          error: 'Unauthorized' 
        })
      )
    })

    it('should return 400 for missing required fields', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-admin-secret': 'test-admin-secret' },
        body: {
          fullName: 'John Doe'
          // Missing email, company, projectName
        }
      }

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining('Missing required fields')
        })
      )
    })
  })
})
