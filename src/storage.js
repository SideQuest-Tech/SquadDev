const REQUESTS_KEY = 'sidequest_tech_requests'
const SESSION_KEY = 'sidequest_tech_admin_session'
const LEGACY_REQUESTS_KEY = 'squaddevs_requests'
const LEGACY_SESSION_KEY = 'squaddevs_admin_session'

export const requestStore = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(REQUESTS_KEY) || localStorage.getItem(LEGACY_REQUESTS_KEY)) || [] } catch { return [] }
  },
  save: (requests) => localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)),
  add: (request) => {
    const requests = requestStore.get()
    requestStore.save([request, ...requests])
  }
}

export const sessionStore = {
  get: () => localStorage.getItem(SESSION_KEY) === 'true' || localStorage.getItem(LEGACY_SESSION_KEY) === 'true',
  set: (value) => value ? localStorage.setItem(SESSION_KEY, 'true') : localStorage.removeItem(SESSION_KEY)
}
