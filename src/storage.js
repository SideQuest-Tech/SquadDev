const SESSION_KEY = 'sidequest_tech_admin_session'
const LEGACY_SESSION_KEY = 'squaddevs_admin_session'

export const sessionStore = {
  get: () => localStorage.getItem(SESSION_KEY) === 'true' || localStorage.getItem(LEGACY_SESSION_KEY) === 'true',
  set: (value) => value ? localStorage.setItem(SESSION_KEY, 'true') : localStorage.removeItem(SESSION_KEY)
}

const CURSOR_PREF_KEY = 'sidequest_cursor_pref'
export const cursorStore = {
  get: () => localStorage.getItem(CURSOR_PREF_KEY) !== 'disabled',
  set: (enabled) => localStorage.setItem(CURSOR_PREF_KEY, enabled ? 'enabled' : 'disabled')
}

const CLIENT_SESSION_KEY = 'sidequest_client_session'
export const clientSessionStore = {
  getToken: () => localStorage.getItem(CLIENT_SESSION_KEY),
  setToken: (jwt) => localStorage.setItem(CLIENT_SESSION_KEY, jwt),
  clear: () => localStorage.removeItem(CLIENT_SESSION_KEY),
  getPayload: () => {
    try {
      const token = localStorage.getItem(CLIENT_SESSION_KEY)
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(CLIENT_SESSION_KEY)
        return null
      }
      return payload
    } catch { return null }
  }
}
