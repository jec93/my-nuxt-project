import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  const q = getQuery(event)
  const domain = String(q.domain || '').trim()

  if (!domain) return { ok: false, allowed: false, reason: 'INVALID_DOMAIN' }
  if (!auth) return { ok: true, allowed: false, reason: 'UNAUTHENTICATED' }

  if (auth.role === 'ADMIN') return { ok: true, allowed: true, reason: 'ADMIN' }

  const perm = await prisma.userPermission.findFirst({
    where: { userId: auth.userId, domain },
    select: { id: true },
  })

  return { ok: true, allowed: !!perm, reason: perm ? 'ALLOWED' : 'FORBIDDEN' }
})
