export default defineEventHandler(async (event) => {
  setCookie(event, 'access_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return { ok: true }
})
