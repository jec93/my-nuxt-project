import { jwtVerify } from 'jose'
import { secretKey } from '~/server/utils/jwt'

export async function getAuthOrNull(event) {
  try {
    const token = getCookie(event, 'access_token')
    if (!token) return null

    const { payload } = await jwtVerify(token, secretKey)
    return {
      userId: String(payload.userId || ''),
      role: String(payload.role || ''),
    }
  } catch {
    return null
  }
}
