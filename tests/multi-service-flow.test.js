import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Integration test simulating the full flow:
 * 1. Customer requests Service A → Gets approved → Client account created
 * 2. Same customer requests Service B → Gets approved → Project added to existing account
 */

const mockRedis = {
  data: new Map(),
  get: vi.fn((key) => {
    const value = mockRedis.data.get(key)
    return Promise.resolve(value || null)
  }),
  set: vi.fn((key, value) => {
    mockRedis.data.set(key, value)
    return Promise.resolve('OK')
  })
}

const mockResend = {
  emails: {
    send: vi.fn().mockResolvedValue({ id: 'email-id' })
  }
}

let folderCounter = 1
let listCounter = 1

global.fetch = vi.fn((url, options) => {
  // Folder creation: POST to /space/{id}/folder
  if (url.includes('/space/') && url.includes('/folder') && options?.method === 'POST') {
    return Promise.resolve({
      json: () => Promise.resolve({ id: `folder-${folderCounter++}` })
    })
  }
  // List creation: POST to /folder/{id}/list
  if (url.includes('/folder/') && url.includes('/list') && options?.method === 'POST') {
    return Promise.resolve({
      json: () => Promise.resolve({ id: `list-${listCounter++}` })
    })
  }
  return Promise.resolve({ json: () => Promise.resolve({}) })
})

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedis)
}))

vi.mock('resend', () => ({
  Resend: vi.fn(() => mockResend)
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password) => Promise.resolve(`hashed_${password}`))
  }
}))

describe('Multi-Service Request Flow (Integration)', () => {
  let handler

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRedis.data.clear()
    folderCounter = 1
    listCounter = 1
    
    const module = await import('../api/admin-approve.js')
    handler = module.default
  })

  it('should handle complete flow: new customer → first service → second service', async () => {

    const customerEmail = 'sarah@acmecorp.com'
    const req = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Customer requests Website Development (First Service)
    // ─────────────────────────────────────────────────────────────────────

    const request1 = {
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        requestId: 'req-001',
        fullName: 'Sarah Johnson',
        email: customerEmail,
        company: 'Acme Corp',
        projectName: 'Website Development'
      }
    }

    await handler(request1, res)

    // Verify first approval succeeded
    expect(res.status).toHaveBeenLastCalledWith(200)
    const firstResponse = res.json.mock.calls[0][0]
    expect(firstResponse).toMatchObject({
      ok: true,
      isExistingClient: false,
      tempPassword: expect.stringMatching(/^SQT-/),
      folderId: 'folder-1',
      listId: 'list-1'
    })

    // Verify welcome email sent with credentials
    expect(mockResend.emails.send).toHaveBeenCalledTimes(1)
    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: customerEmail,
        subject: 'Your Acme Corp project portal is ready',
        html: expect.stringContaining('Temporary password')
      })
    )

    // Verify client record exists in mock Redis
    const clientData = mockRedis.data.get('client:sarah@acmecorp.com')
    expect(clientData).toBeTruthy()
    const client = JSON.parse(clientData)
    expect(client).toMatchObject({
      email: customerEmail,
      fullName: 'Sarah Johnson',
      company: 'Acme Corp',
      clickupFolderId: 'folder-1',
      isActive: true,
      mustChangePassword: true
    })

    // Verify project list
    const projectsData = mockRedis.data.get('client_projects:sarah@acmecorp.com')
    const projects = JSON.parse(projectsData)
    expect(projects).toEqual(['list-1'])

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Same customer requests Mobile App (Second Service)
    // ─────────────────────────────────────────────────────────────────────

    vi.clearAllMocks() // Clear mocks but keep Redis data

    const request2 = {
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        requestId: 'req-002',
        fullName: 'Sarah Johnson',
        email: customerEmail, // SAME EMAIL
        company: 'Acme Corp',
        projectName: 'Mobile App Development' // DIFFERENT SERVICE
      }
    }

    await handler(request2, res)

    // Verify second approval succeeded
    expect(res.status).toHaveBeenLastCalledWith(200)
    const secondResponse = res.json.mock.calls[0][0]
    expect(secondResponse).toMatchObject({
      ok: true,
      isExistingClient: true, // ✅ Recognized as existing
      tempPassword: null,      // ✅ No new password
      folderId: 'folder-1',    // ✅ Reused same folder
      listId: 'list-2'         // ✅ New list created
    })

    // Verify "project added" email sent (NOT welcome email)
    expect(mockResend.emails.send).toHaveBeenCalledTimes(1)
    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: customerEmail,
        subject: 'New project added: Mobile App Development',
        html: expect.stringContaining('existing login credentials')
      })
    )

    // Verify client record unchanged (same password hash, folder, etc.)
    const clientDataAfter = mockRedis.data.get('client:sarah@acmecorp.com')
    const clientAfter = JSON.parse(clientDataAfter)
    expect(clientAfter.passwordHash).toBe(client.passwordHash) // Same password
    expect(clientAfter.clickupFolderId).toBe('folder-1')       // Same folder

    // Verify project list now has BOTH projects
    const projectsDataAfter = mockRedis.data.get('client_projects:sarah@acmecorp.com')
    const projectsAfter = JSON.parse(projectsDataAfter)
    expect(projectsAfter).toEqual(['list-1', 'list-2']) // ✅ Both projects

    // Verify both project records exist with unique names
    const project1 = JSON.parse(mockRedis.data.get('project:list-1'))
    const project2 = JSON.parse(mockRedis.data.get('project:list-2'))

    expect(project1).toMatchObject({
      listId: 'list-1',
      clientEmail: customerEmail,
      projectStatus: 'in_progress'
    })
    // Verify unique name format: "Website Development [202609-123456ABCD]"
    expect(project1.listName).toMatch(/^Website Development \[\d{6}-\d{6}[A-Z0-9]{4}\]$/)

    expect(project2).toMatchObject({
      listId: 'list-2',
      clientEmail: customerEmail,
      projectStatus: 'in_progress'
    })
    // Verify unique name format for second project
    expect(project2.listName).toMatch(/^Mobile App Development \[\d{6}-\d{6}[A-Z0-9]{4}\]$/)
  })

  it('should handle third service request for same customer', async () => {
    const customerEmail = 'john@startup.io'
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() }

    // First service
    await handler({
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        fullName: 'John Smith',
        email: customerEmail,
        company: 'StartupIO',
        projectName: 'MVP Development'
      }
    }, res)

    // Second service (don't clear mocks - we want fetch calls to accumulate)
    await handler({
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        fullName: 'John Smith',
        email: customerEmail,
        company: 'StartupIO',
        projectName: 'Marketing Website'
      }
    }, res)

    // Third service
    await handler({
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        fullName: 'John Smith',
        email: customerEmail,
        company: 'StartupIO',
        projectName: 'Business Automation'
      }
    }, res)

    // Verify all three projects in array
    const projects = JSON.parse(mockRedis.data.get('client_projects:john@startup.io'))
    expect(projects).toHaveLength(3)
    expect(projects).toEqual(['list-1', 'list-2', 'list-3'])

    // Verify only ONE folder created (all share same folder)
    expect(global.fetch.mock.calls.filter(
      call => call[0].includes('/space/') && call[0].includes('/folder') && call[1]?.method === 'POST'
    )).toHaveLength(1)

    // Verify THREE lists created
    expect(global.fetch.mock.calls.filter(
      call => call[0].includes('/folder/') && call[0].includes('/list') && call[1]?.method === 'POST'
    )).toHaveLength(3)
  })

  it('should generate unique suffixes for duplicate project names', async () => {
    const customerEmail = 'client@example.com'
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() }

    // Create first "Website Development" project
    await handler({
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        fullName: 'Test Client',
        email: customerEmail,
        company: 'Test Co',
        projectName: 'Website Development'
      }
    }, res)

    // Create second "Website Development" project (same name)
    await handler({
      method: 'POST',
      headers: { 'x-admin-secret': 'test-admin-secret' },
      body: {
        fullName: 'Test Client',
        email: customerEmail,
        company: 'Test Co',
        projectName: 'Website Development' // Same name as first
      }
    }, res)

    // Verify both projects were created successfully
    const projects = JSON.parse(mockRedis.data.get('client_projects:client@example.com'))
    expect(projects).toHaveLength(2)

    // Verify both have unique names with different timestamps
    const project1 = JSON.parse(mockRedis.data.get('project:list-1'))
    const project2 = JSON.parse(mockRedis.data.get('project:list-2'))

    expect(project1.listName).toMatch(/^Website Development \[\d{6}-\d{6}[A-Z0-9]{4}\]$/)
    expect(project2.listName).toMatch(/^Website Development \[\d{6}-\d{6}[A-Z0-9]{4}\]$/)
    
    // Verify the suffixes are different (random component ensures uniqueness)
    expect(project1.listName).not.toBe(project2.listName)
  })
})
