export default defineEventHandler(async (event) => {
  setCookie(event, 'access_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 0,
  })

  setCookie(event, 'logged_in', '', {
    httpOnly: false,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 0,
  })

  return { ok: true }
})
