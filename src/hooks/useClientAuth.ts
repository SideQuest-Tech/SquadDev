import { clientSessionStore, ClientPayload } from '../storage'

interface UseClientAuthResult {
  client: ClientPayload | null
  token: string | null
  logout: () => void
}

export function useClientAuth(setView: (view: any) => void): UseClientAuthResult {
  const payload = clientSessionStore.getPayload()
  const token = clientSessionStore.getToken()

  const logout = () => {
    clientSessionStore.clear()
    setView('site')
  }

  return { client: payload, token, logout }
}
