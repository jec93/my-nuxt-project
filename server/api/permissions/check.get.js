import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  const q = getQuery(event)
  const domain = String(q.domain || '').trim()

  if (!domain) {
    return { ok: false, allowed: false, reason: 'INVALID_DOMAIN' }
  }

  if (!auth) {
    return { ok: true, allowed: false, reason: 'UNAUTHENTICATED' }
  }

  // 2) user_permission 같은 테이블이 있다면 아래로 체크
  // 없으면 일단 false로
  // const perm = await prisma.userPermission.findFirst({
  //   where: { userId: auth.userId, domain, enabled: true },
  //   select: { id: true },
  // })
  // return { ok: true, allowed: !!perm, reason: perm ? 'ALLOWED' : 'FORBIDDEN' }

  return { ok: true, allowed: false, reason: 'FORBIDDEN' }
})
