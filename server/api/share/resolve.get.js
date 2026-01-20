import { prisma } from '~/server/utils/prisma'
import { verifyShareToken } from '~/server/utils/shareToken'
import { getAuthOrNull } from '~/server/utils/auth' // 너 프로젝트의 auth 유틸(없으면 아래 참고)

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const t = String(q.t || '')
  const payload = verifyShareToken(t)

  if (!payload) {
    return { ok: false, reason: 'INVALID_OR_EXPIRED' }
  }

  const menu = await prisma.menu.findUnique({
    where: { screenKey: payload.menuKey },
    select: { screenKey: true, label: true, domain: true, url: true, depth: true },
  })

  if (!menu || menu.depth !== 3 || !menu.domain || !menu.url || menu.domain !== payload.domain) {
    return { ok: false, reason: 'MENU_NOT_FOUND' }
  }

  const auth = await getAuthOrNull(event) // { userId, role } or null
  if (!auth) {
    return { ok: true, allowed: false, reason: 'UNAUTHENTICATED', menu }
  }

  const perm = await prisma.user_permission.findFirst({
    where: { userId: auth.userId, domain: menu.domain, enabled: true },
    select: { id: true },
  })

  return {
    ok: true,
    allowed: !!perm,
    reason: perm ? 'ALLOWED' : 'FORBIDDEN',
    menu,
  }
})