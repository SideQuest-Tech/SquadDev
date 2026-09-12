const ADMIN_SESSION_KEY = 'sidequest_tech_admin_session'
const LEGACY_SESSION_KEY = 'squaddevs_admin_session'

export const sessionStore = {
  isLoggedIn: (): boolean => {
    if (localStorage.getItem(LEGACY_SESSION_KEY) === 'true') return true
    const token = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!token) return false
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string; exp?: number }
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(ADMIN_SESSION_KEY)
        return false
      }
      return payload.role === 'admin'
    } catch { return false }
  },
  getToken: (): string | null => localStorage.getItem(ADMIN_SESSION_KEY),
  setToken: (jwt: string): void => localStorage.setItem(ADMIN_SESSION_KEY, jwt),
  clear: (): void => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
  }
}

const CURSOR_PREF_KEY = 'sidequest_cursor_pref'
export const cursorStore = {
  get: (): boolean => localStorage.getItem(CURSOR_PREF_KEY) !== 'disabled',
  set: (enabled: boolean): void => localStorage.setItem(CURSOR_PREF_KEY, enabled ? 'enabled' : 'disabled')
}

export interface ClientPayload {
  sub: string
  name: string
  company: string
  exp?: number
  [key: string]: any
}

const CLIENT_SESSION_KEY = 'sidequest_client_session'
export const clientSessionStore = {
  getToken: (): string | null => localStorage.getItem(CLIENT_SESSION_KEY),
  setToken: (jwt: string): void => localStorage.setItem(CLIENT_SESSION_KEY, jwt),
  clear: (): void => localStorage.removeItem(CLIENT_SESSION_KEY),
  getPayload: (): ClientPayload | null => {
    try {
      const token = localStorage.getItem(CLIENT_SESSION_KEY)
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1])) as ClientPayload
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(CLIENT_SESSION_KEY)
        return null
      }
      return payload
    } catch { return null }
  }
}
