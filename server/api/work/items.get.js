import Summary from 'ant-design-vue/es/vc-table/Footer/Summary'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const domain = String(q.domain || '')
  if (!domain) return { rows: [], total: 0, Summary: { total : 0, waiting: 0, inProgress: 0, done : 0} }

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

  const [total, rawRows, grouped] = await Promise.all([
    prisma.workItem.count({ where }),
    prisma.workItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: { id: true, title: true, status: true, owner: true, createdAt: true },
    }),
    prisma.workItem.groupBy({
      by : ['status'],
      where,
      _count : {_all : true },
    }),
  ])

  const rows = rawRows.map((r) => ({
    ...r,
    id: r.id.toString(),
  }))

  //KPI summary
  const summary = { total, waiting: 0, inProgress:0, done:0}
  for(const g of grouped){
    if(g.status === '대기') summary.waiting = g._count._all
    if(g.status === '진행') summary.inProgress = g._count._all
    if(g.status === '완료') summary.done = g._count._all
  }

  return { rows, total, summary }
})
