import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const menus = await prisma.menu.findMany({
    where: { isActive: true },
    orderBy: [{ depth: 'asc' }, { order: 'asc' }],
    select: {
      screenKey: true,
      parentKey: true,
      label: true,
      url: true,
      domain: true,
      depth: true,
      order: true,
    },
  })

  return { menus }
})
