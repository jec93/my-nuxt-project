import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })

  const items = await prisma.shareInbox.findMany({
    where: { toUserId: auth.userId, status: 'NEW' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      menuKey: true,
      domain: true,
      message: true,
      status: true,
      createdAt: true,
    },
  })

  //sender loginId 붙이기
  const fromIds = [...new Set(items.map((x) => x.fromUserId))]
  const users = await prisma.user.findMany({
    where: { id: { in: fromIds } },
    select: { id: true, loginId: true, role: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  //menu label 붙이기 (menuKey로 조회)
  const menuKeys = [...new Set(items.map((x) => x.menuKey))]
  const menus = await prisma.menu.findMany({
    where: { screenKey: { in: menuKeys } },
    select: { screenKey: true, label: true },
  })
  const menuMap = new Map(menus.map((m) => [m.screenKey, m.label]))

  const enriched = items.map((x) => ({
    ...x,
    fromLoginId: userMap.get(x.fromUserId)?.loginId || '(unknown)',
    fromRole: userMap.get(x.fromUserId)?.role || '',
    menuLabel: menuMap.get(x.menuKey) || x.menuKey,
  }))

  return { ok: true, items: enriched }
})
