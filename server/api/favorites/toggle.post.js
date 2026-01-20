import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const menuKey = String(body?.menuKey || '')
  if (!menuKey) throw createError({ statusCode: 400, statusMessage: 'menuKey required' })

  // leaf만 허용(선택) - 너 정책에 맞게 유지
  const leaf = await prisma.menu.findUnique({
    where: { screenKey: menuKey },
    select: { depth: true, isActive: true },
  })
  if (!leaf || !leaf.isActive || leaf.depth !== 3) {
    throw createError({ statusCode: 400, statusMessage: 'Only leaf menus can be favorited' })
  }

  const exists = await prisma.favorite.findUnique({
    where: { userId_menuKey: { userId, menuKey } }, // @@unique([userId, menuKey]) 기준
    select: { id: true },
  })

  if (exists) {
    await prisma.favorite.delete({
      where: { userId_menuKey: { userId, menuKey } },
    })
    return { isFavorite: false }
  }

  // 추가 시 sortOrder는 "맨 뒤"로
  const max = await prisma.favorite.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  })
  const nextOrder = (max._max.sortOrder || 0) + 1

  await prisma.favorite.create({
    data: { userId, menuKey, sortOrder: nextOrder },
  })

  return { isFavorite: true }
})
