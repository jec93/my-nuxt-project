import { prisma } from '~/server/utils/prisma'
import { getAuthOrNull } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await getAuthOrNull(event)
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'UNAUTHENTICATED' })

  const body = await readBody(event)
  const toUserId = String(body?.toUserId || auth.userId)
  const menuKey = String(body?.menuKey || '')
  const msg = String(body?.message || '')

  if (!toUserId || !menuKey) {
    throw createError({ statusCode: 400, statusMessage: 'toUserId/menuKey required' })
  }

  const menu = await prisma.menu.findUnique({
    where: { screenKey: menuKey },
    select: { screenKey: true, label: true, domain: true, url: true, depth: true },
  })

  if (!menu || menu.depth !== 3 || !menu.domain || !menu.url) {
    throw createError({ statusCode: 404, statusMessage: 'menu not found' })
  }

  await prisma.shareInbox.create({
    data: {
      fromUserId: auth.userId,
      toUserId,
      menuKey: menu.screenKey,
      domain: menu.domain,
      message: msg || null,
      status: 'NEW',
    },
  })

  return { ok: true }
})
