import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const domain = String(q.domain || '')
  if (!domain) return { rows: [], total: 0 }

  const keyword = String(q.keyword || '').trim()
  const status = String(q.status || '').trim()

  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 10)))
  const skip = (page - 1) * pageSize

  const where = {
    domain,
    ...(status ? { status } : {}),
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { owner: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [total, rawRows] = await Promise.all([
    prisma.workItem.count({ where }),
    prisma.workItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: { id: true, title: true, status: true, owner: true, createdAt: true },
    }),
  ])

  const rows = rawRows.map((r) => ({
    ...r,
    id: r.id.toString(),
  }))

  return { rows, total }
})
