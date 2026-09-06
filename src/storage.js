import { projects as seedProjects } from './data/projects'

const SESSION_KEY = 'sidequest_tech_admin_session'
const LEGACY_SESSION_KEY = 'squaddevs_admin_session'
const PORTAL_SESSION_KEY = 'sidequest_tech_client_session'
const PROJECTS_KEY = 'sidequest_tech_projects'
const PROJECTS_EVENT = 'sidequest:projects-changed'

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

// Client tracker session (Track Project): stores the id of the project the client signed in to.
// Separate from clientSessionStore above, which holds the JWT for the ClickUp-backed client portal.
export const portalSessionStore = {
  get: () => { try { return localStorage.getItem(PORTAL_SESSION_KEY) || '' } catch { return '' } },
  set: (projectId) => projectId ? localStorage.setItem(PORTAL_SESSION_KEY, projectId) : localStorage.removeItem(PORTAL_SESSION_KEY)
}

// Client project trackers. One record per project, read by the client tracker and edited from
// the admin Client Trackers view. Seeded from src/data/projects.js the first time nothing is stored.
// Client ticks and approvals write into the same record so the admin sees them.
const clone = value => JSON.parse(JSON.stringify(value))
const readProjects = () => {
  try { const stored = JSON.parse(localStorage.getItem(PROJECTS_KEY) || 'null'); return Array.isArray(stored) ? stored : null } catch { return null }
}
const normalizeKey = value => String(value || '').trim().toLowerCase()

export const projectStore = {
  get: () => readProjects() ?? clone(seedProjects),
  save: (projects) => { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); window.dispatchEvent(new Event(PROJECTS_EVENT)) },
  find: (id) => projectStore.get().find(project => project.id === id) || null,
  findByAccess: (email, code) => {
    const wantedEmail = normalizeKey(email)
    const wantedCode = String(code || '').trim().toUpperCase().replace(/\s+/g, '')
    return projectStore.get().find(project => normalizeKey(project.client?.email) === wantedEmail && project.accessCode === wantedCode) || null
  },
  add: (project) => { projectStore.save([project, ...projectStore.get()]); return project },
  update: (id, patch) => {
    const next = projectStore.get().map(project => project.id === id ? { ...project, ...(typeof patch === 'function' ? patch(project) : patch) } : project)
    projectStore.save(next)
    return next.find(project => project.id === id) || null
  },
  remove: (id) => projectStore.save(projectStore.get().filter(project => project.id !== id)),
  isSeed: (id) => seedProjects.some(project => project.id === id),
  restore: (id) => {
    const seed = seedProjects.find(project => project.id === id)
    if (seed) projectStore.save(projectStore.get().map(project => project.id === id ? clone(seed) : project))
  },
  // Fires after any save in this tab, and when another tab changes the stored projects.
  subscribe: (listener) => {
    const onStorage = event => { if (event.key === null || event.key === PROJECTS_KEY) listener() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(PROJECTS_EVENT, listener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(PROJECTS_EVENT, listener) }
  }
}
