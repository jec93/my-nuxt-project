import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })
  if (auth.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const req = await prisma.permissionRequest.findUnique({ where: { id } })
  if (!req || req.status !== 'PENDING') {
    throw createError({ statusCode: 404, statusMessage: 'REQUEST_NOT_FOUND' })
  }

  // 권한 부여(upsert로 안전)
  await prisma.userPermission.upsert({
    where: { userId_domain: { userId: req.userId, domain: req.domain } },
    update: {},
    create: { userId: req.userId, domain: req.domain, grantedBy: auth.userId },
  })

  // 요청 승인 처리
  await prisma.permissionRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      decidedAt: new Date(),
      decidedBy: auth.userId,
    },
  })

  return { ok: true }
})
