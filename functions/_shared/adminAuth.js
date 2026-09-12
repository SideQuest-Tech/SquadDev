import { jwtVerify } from 'jose'

export async function verifyAdminToken(request, env) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return false
    const secret = new TextEncoder().encode(env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload.role === 'admin'
  } catch { return false }
}
