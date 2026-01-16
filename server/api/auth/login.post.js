import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/prisma'
import { signAccessToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, password } = body || {}

  if (!id || !password) {
    throw createError({ statusCode: 400, statusMessage: 'id/password required' })
  }

  const user = await prisma.user.findUnique({ where: { loginId: id } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await signAccessToken({
    sub: user.id,
    loginId: user.loginId,
    role: user.role,
  })

  // JWT (보안용)
  setCookie(event, 'access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 2,
  })

  // 로그인 상태 플래그 (프론트 라우팅용)
  setCookie(event, 'logged_in', '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 2,
  })

  return { ok: true, user: { loginId: user.loginId, role: user.role } }
})
