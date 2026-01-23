import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })

  const body = await readBody(event)
  const domain = String(body?.domain || '').trim()
  const reason = String(body?.reason || '').trim()

  if (!domain) throw createError({ statusCode: 400, statusMessage: 'domain required' })

  const has = await prisma.userPermission.findUnique({
    where: { userId_domain: { userId: auth.userId, domain } },
    select: { id: true },
  })
  if (has) return { ok: true, requested: false, reason: 'ALREADY_ALLOWED' }

  // PENDING 요청 생성(중복 방지)
  const req = await prisma.permissionRequest.upsert({
    where: { userId_domain_status: { userId: auth.userId, domain, status: 'PENDING' } },
    update: { reason: reason || null },
    create: {
      userId: auth.userId,
      domain,
      status: 'PENDING',
      reason: reason || null,
    },
    select: { id: true, status: true },
  })

  return { ok: true, requested: true, requestId: req.id }
})
