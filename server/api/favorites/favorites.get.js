import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const favs = await prisma.favorite.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  const keys = favs.map(f => f.menuKey)

  const menus = await prisma.menu.findMany({
    where: { screenKey: { in: keys }, isActive: true },
    select: { screenKey: true, label: true, url: true, domain: true, depth: true },
  })

  const menuMap = new Map(menus.map(m => [m.screenKey, m]))

  // 즐겨찾기 순서 유지
  return favs
    .map(f => menuMap.get(f.menuKey))
    .filter(Boolean)
    .map(m => ({
      screenKey: m.screenKey,
      label: m.label,
      url: m.url,
      domain: m.domain,
      depth: m.depth,
    }))
})
