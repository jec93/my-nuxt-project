import { signAccessToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, password } = body || {}

  if (!id || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id/password required',
    })
  }

  // 지금은 DB 없이 임시 로그인
  if (!(id === 'test' && password === '1234')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // JWT 발급
  const token = await signAccessToken({
    sub: 'temp_test_user',
    loginId: id,
    role: 'USER',
  })

  // 보안용 JWT (JS에서 접근 불가)
  setCookie(event, 'access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,   // 개발환경
    path: '/',
    maxAge: 60 * 60 * 2,
  })

  // 로그인 상태 판단용 쿠키 (JS에서 읽음)
  setCookie(event, 'logged_in', '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 2,
  })

  return {
    ok: true,
    user: {
      loginId: id,
      role: 'USER',
    },
  }
})
