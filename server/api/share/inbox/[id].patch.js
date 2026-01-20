import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const status = String(body?.status || '') // 'READ' or 'DISMISSED'

  if (!id || !['READ', 'DISMISSED'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid request' })
  }

  // 내 것만 수정
  await prisma.share_inbox.updateMany({
    where: { id, toUserId: auth.userId },
    data: {
      status,
      readAt: status === 'READ' ? new Date() : null,
    },
  })

  return { ok: true }
})
