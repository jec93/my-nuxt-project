import { prisma } from '~/server/utils/prisma'
import { signShareToken } from '~/server/utils/shareToken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const menuKey = String(body?.menuKey || '')

  if (!menuKey) {
    throw createError({ statusCode: 400, statusMessage: 'menuKey required' })
  }

  // 유효한 leaf인지 정도는 검증
  const menu = await prisma.menu.findUnique({
    where: { screenKey: menuKey },
    select: { screenKey: true, label: true, domain: true, url: true, depth: true },
  })

  if (!menu || menu.depth !== 3 || !menu.domain || !menu.url) {
    throw createError({ statusCode: 404, statusMessage: 'menu not found' })
  }

  const token = signShareToken({
    menuKey: menu.screenKey,
    domain: menu.domain,
  })

  return {
    ok: true,
    shareUrl: `/share?t=${encodeURIComponent(token)}`,
  }
})