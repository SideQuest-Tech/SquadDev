const REQUESTS_KEY = 'sidequest_tech_requests'
const SESSION_KEY = 'sidequest_tech_admin_session'
const LEGACY_REQUESTS_KEY = 'squaddevs_requests'
const LEGACY_SESSION_KEY = 'squaddevs_admin_session'

const validStatuses = ['New', 'Reviewing', 'Contacted', 'In Progress', 'Completed', 'Archived']

const normalizeUrgency = value => {
  const urgency = String(value || '').trim()
  if (/^flexible$/i.test(urgency)) return 'Low'
  if (/^standard$/i.test(urgency)) return 'Medium'
  if (/^low|medium|high|urgent$/i.test(urgency)) return urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase()
  return urgency || 'Medium'
}

export const normalizeRequest = (request = {}, index = 0) => {
  const createdAt = request.createdAt || request.submittedAt || new Date().toISOString()
  const fallbackId = Number.isFinite(Date.parse(createdAt)) ? Date.parse(createdAt) + index : Date.now() + index
  const id = request.id ?? fallbackId
  return {
    ...request,
    id,
    reference: request.reference || `SQT-${new Date(createdAt).getFullYear()}-${String(id).slice(-6)}`,
    fullName: request.fullName || request.name || 'Unknown client',
    company: request.company || '',
    need: request.need || request.service || 'unsure',
    budget: request.budget || 'Not specified',
    launchDate: request.launchDate || request.timeline || 'Not specified',
    urgency: normalizeUrgency(request.urgency),
    status: validStatuses.includes(request.status) ? request.status : 'New',
    createdAt,
    adminNotes: request.adminNotes || ''
  }
}

const normalizeRequests = requests => Array.isArray(requests) ? requests.map(normalizeRequest) : []

export const requestStore = {
  get: () => {
    try { return normalizeRequests(JSON.parse(localStorage.getItem(REQUESTS_KEY) || localStorage.getItem(LEGACY_REQUESTS_KEY)) || []) } catch { return [] }
  },
  save: (requests) => localStorage.setItem(REQUESTS_KEY, JSON.stringify(normalizeRequests(requests))),
  add: (request) => {
    const requests = requestStore.get()
    requestStore.save([request, ...requests])
  }
}

export const sessionStore = {
  get: () => localStorage.getItem(SESSION_KEY) === 'true' || localStorage.getItem(LEGACY_SESSION_KEY) === 'true',
  set: (value) => value ? localStorage.setItem(SESSION_KEY, 'true') : localStorage.removeItem(SESSION_KEY)
}
