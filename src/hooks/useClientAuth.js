import { clientSessionStore } from '../storage'

export function useClientAuth(setView) {
  const payload = clientSessionStore.getPayload()
  const token = clientSessionStore.getToken()

  const logout = () => {
    clientSessionStore.clear()
    setView('site')
  }

  return { client: payload, token, logout }
}
