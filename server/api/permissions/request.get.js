import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })
  if (auth.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })

  const items = await prisma.permissionRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestedAt: 'desc' },
    take: 50,
  })

  // 요청자 loginId 붙이기
  const ids = [...new Set(items.map(x => x.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, loginId: true, role: true },
  })
  const map = new Map(users.map(u => [u.id, u]))

  return {
    ok: true,
    items: items.map(x => ({
      ...x,
      loginId: map.get(x.userId)?.loginId || '(unknown)',
    })),
  }
})
