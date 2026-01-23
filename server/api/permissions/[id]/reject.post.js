import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })
  if (auth.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const reason = String(body?.reason || '').trim()

  await prisma.permissionRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      decidedAt: new Date(),
      decidedBy: auth.userId,
      reason: reason || null,
    },
  })

  return { ok: true }
})
