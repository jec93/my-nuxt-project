import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const body = await readBody(event)

  const keys = Array.isArray(body?.menuKeys) ? body.menuKeys : []

  // 중복 제거 + 비어있는 값 제거
  const uniqueKeys = [...new Set(keys.map(String))].filter(Boolean)

  // leaf만 허용(= depth 3 && url 존재 같은 조건)
  const leafMenus = await prisma.menu.findMany({
    where: {
      screenKey: { in: uniqueKeys },
      isActive: true,
      depth: 3,
      // url: { not: null }, // 너가 leaf에만 url 넣는 구조면 이것도 추천
    },
    select: { screenKey: true },
  })
  const allowed = new Set(leafMenus.map(m => m.screenKey))

  const finalKeys = uniqueKeys.filter(k => allowed.has(k))

  // 트랜잭션: 기존 삭제 후 재삽입(순서 포함)
  await prisma.$transaction(async (tx) => {
    await tx.favorite.deleteMany({ where: { userId } })

    if (finalKeys.length) {
      await tx.favorite.createMany({
        data: finalKeys.map((k, idx) => ({
          userId,
          menuKey: k,
          sortOrder: idx + 1,
        })),
      })
    }
  })

  return { ok: true, count: finalKeys.length }
})
