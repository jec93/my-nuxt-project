import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })
  }

  const q = getQuery(event)
  const keyword = String(q.q || '').trim()

  const users = await prisma.user.findMany({
    where: keyword
      ? {
          loginId: { contains: keyword, mode: 'insensitive' },
        }
      : undefined,
    orderBy: { loginId: 'asc' },
    take: 200,
    select: {
      id: true,
      loginId: true,
      role: true,
      createdAt: true,
      // password는 절대 내려주지 말기
    },
  })

  return { ok: true, users }
})
