export default defineNuxtRouteMiddleware((to, from) => {
  // 프론트에서 읽을 수 있는 로그인 상태 쿠키
  const loggedIn = useCookie('logged_in').value

  console.log('[MW]', {
    from: from?.fullPath,
    to: to.fullPath,
    loggedIn,
  })

  // 공개 페이지
  if (to.path === '/login' || to.path === '/register') {
    // 이미 로그인 상태면 홈으로
    if (loggedIn) {
      return navigateTo('/')
    }
    return
  }

  // 보호 페이지
  if (!loggedIn) {
    return navigateTo('/login')
  }
})
