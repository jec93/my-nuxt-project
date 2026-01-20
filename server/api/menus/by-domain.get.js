import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { domain } = getQuery(event)
  const d = String(domain || '')
  if (!d) return null

  const menu = await prisma.menu.findFirst({
    where: { domain: d, isActive: true, depth: 3 },
    select: { screenKey: true, label: true },
  })
  return menu
})
