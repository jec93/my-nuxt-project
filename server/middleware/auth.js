// server/middleware/auth.js
import { getCookie } from 'h3'
import { verifyAccessToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'access_token')
  if (!token) return

  try {
    const payload = await verifyAccessToken(token)
    event.context.auth = {
      userId: String(payload.userId || ''),
      role: payload.role || 'admin',
    }
  } catch (e) {
    event.context.auth = null
  }
})
