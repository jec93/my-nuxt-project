require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
})

const COMMON_URL = '/work/grid'

const menus = [
  // 1depth
  { screenKey: "OPS", parentKey: null, label: "업무 운영", depth: 1, order: 1, url: null, domain: null },
  { screenKey: "COLLAB", parentKey: null, label: "협업", depth: 1, order: 2, url: null, domain: null },
  { screenKey: "REPORT", parentKey: null, label: "리포트", depth: 1, order: 3, url: null, domain: null },

  // OPS - 2depth (4)
  { screenKey: "OPS_TASK", parentKey: "OPS", label: "작업 관리", depth: 2, order: 1, url: null, domain: null },
  { screenKey: "OPS_SCHEDULE", parentKey: "OPS", label: "일정", depth: 2, order: 2, url: null, domain: null },
  { screenKey: "OPS_APPROVAL", parentKey: "OPS", label: "승인", depth: 2, order: 3, url: null, domain: null },
  { screenKey: "OPS_ASSET", parentKey: "OPS", label: "리소스", depth: 2, order: 4, url: null, domain: null },

  // OPS_TASK - 3depth (3)
  { screenKey: "OPS_TASK_ALL", parentKey: "OPS_TASK", label: "전체 작업", depth: 3, order: 1, url: COMMON_URL, domain: "ops.tasks.all" },
  { screenKey: "OPS_TASK_MY", parentKey: "OPS_TASK", label: "내 작업", depth: 3, order: 2, url: COMMON_URL, domain: "ops.tasks.my" },
  { screenKey: "OPS_TASK_TEMPLATE", parentKey: "OPS_TASK", label: "템플릿", depth: 3, order: 3, url: COMMON_URL, domain: "ops.tasks.templates" },

  // OPS_SCHEDULE - 3depth (3)
  { screenKey: "OPS_SCHEDULE_TEAM", parentKey: "OPS_SCHEDULE", label: "팀 일정", depth: 3, order: 1, url: COMMON_URL, domain: "ops.schedule.team" },
  { screenKey: "OPS_SCHEDULE_MY", parentKey: "OPS_SCHEDULE", label: "내 일정", depth: 3, order: 2, url: COMMON_URL, domain: "ops.schedule.my" },
  { screenKey: "OPS_SCHEDULE_BOOK", parentKey: "OPS_SCHEDULE", label: "예약", depth: 3, order: 3, url: COMMON_URL, domain: "ops.schedule.booking" },

  // OPS_APPROVAL - 3depth (3)
  { screenKey: "OPS_APPROVAL_INBOX", parentKey: "OPS_APPROVAL", label: "결재함", depth: 3, order: 1, url: COMMON_URL, domain: "ops.approval.inbox" },
  { screenKey: "OPS_APPROVAL_REQUEST", parentKey: "OPS_APPROVAL", label: "결재 요청", depth: 3, order: 2, url: COMMON_URL, domain: "ops.approval.request" },
  { screenKey: "OPS_APPROVAL_HISTORY", parentKey: "OPS_APPROVAL", label: "결재 이력", depth: 3, order: 3, url: COMMON_URL, domain: "ops.approval.history" },

  // OPS_ASSET - 3depth (3)
  { screenKey: "OPS_ASSET_POOL", parentKey: "OPS_ASSET", label: "리소스 풀", depth: 3, order: 1, url: COMMON_URL, domain: "ops.asset.pool" },
  { screenKey: "OPS_ASSET_ASSIGN", parentKey: "OPS_ASSET", label: "배정 현황", depth: 3, order: 2, url: COMMON_URL, domain: "ops.asset.assignments" },
  { screenKey: "OPS_ASSET_REQ", parentKey: "OPS_ASSET", label: "요청/반납", depth: 3, order: 3, url: COMMON_URL, domain: "ops.asset.requests" },

  // COLLAB - 2depth (4)
  { screenKey: "COLLAB_NOTICE", parentKey: "COLLAB", label: "공지", depth: 2, order: 1, url: null, domain: null },
  { screenKey: "COLLAB_QNA", parentKey: "COLLAB", label: "Q&A", depth: 2, order: 2, url: null, domain: null },
  { screenKey: "COLLAB_CHAT", parentKey: "COLLAB", label: "대화", depth: 2, order: 3, url: null, domain: null },
  { screenKey: "COLLAB_DOC", parentKey: "COLLAB", label: "문서", depth: 2, order: 4, url: null, domain: null },

  // COLLAB_NOTICE - 3depth (3)
  { screenKey: "COLLAB_NOTICE_ALL", parentKey: "COLLAB_NOTICE", label: "전체 공지", depth: 3, order: 1, url: COMMON_URL, domain: "collab.notice.all" },
  { screenKey: "COLLAB_NOTICE_TEAM", parentKey: "COLLAB_NOTICE", label: "팀 공지", depth: 3, order: 2, url: COMMON_URL, domain: "collab.notice.team" },
  { screenKey: "COLLAB_NOTICE_PINNED", parentKey: "COLLAB_NOTICE", label: "고정 공지", depth: 3, order: 3, url: COMMON_URL, domain: "collab.notice.pinned" },

  // COLLAB_QNA - 3depth (3)
  { screenKey: "COLLAB_QNA_ALL", parentKey: "COLLAB_QNA", label: "전체 문의", depth: 3, order: 1, url: COMMON_URL, domain: "collab.qna.all" },
  { screenKey: "COLLAB_QNA_MY", parentKey: "COLLAB_QNA", label: "내 문의", depth: 3, order: 2, url: COMMON_URL, domain: "collab.qna.my" },
  { screenKey: "COLLAB_QNA_KB", parentKey: "COLLAB_QNA", label: "지식베이스", depth: 3, order: 3, url: COMMON_URL, domain: "collab.qna.kb" },

  // COLLAB_CHAT - 3depth (3)
  { screenKey: "COLLAB_CHAT_DM", parentKey: "COLLAB_CHAT", label: "1:1 대화", depth: 3, order: 1, url: COMMON_URL, domain: "collab.chat.dm" },
  { screenKey: "COLLAB_CHAT_GROUP", parentKey: "COLLAB_CHAT", label: "그룹 대화", depth: 3, order: 2, url: COMMON_URL, domain: "collab.chat.group" },
  { screenKey: "COLLAB_CHAT_ARCHIVE", parentKey: "COLLAB_CHAT", label: "보관함", depth: 3, order: 3, url: COMMON_URL, domain: "collab.chat.archive" },

  // COLLAB_DOC - 3depth (3)
  { screenKey: "COLLAB_DOC_SHARED", parentKey: "COLLAB_DOC", label: "공유 문서", depth: 3, order: 1, url: COMMON_URL, domain: "collab.doc.shared" },
  { screenKey: "COLLAB_DOC_MY", parentKey: "COLLAB_DOC", label: "내 문서", depth: 3, order: 2, url: COMMON_URL, domain: "collab.doc.my" },
  { screenKey: "COLLAB_DOC_TEMPLATE", parentKey: "COLLAB_DOC", label: "템플릿", depth: 3, order: 3, url: COMMON_URL, domain: "collab.doc.templates" },

  // REPORT - 2depth (4)
  { screenKey: "REPORT_DASH", parentKey: "REPORT", label: "대시보드", depth: 2, order: 1, url: null, domain: null },
  { screenKey: "REPORT_METRIC", parentKey: "REPORT", label: "지표", depth: 2, order: 2, url: null, domain: null },
  { screenKey: "REPORT_AUDIT", parentKey: "REPORT", label: "감사/로그", depth: 2, order: 3, url: null, domain: null },
  { screenKey: "REPORT_EXPORT", parentKey: "REPORT", label: "내보내기", depth: 2, order: 4, url: null, domain: null },

  // REPORT_DASH - 3depth (3)
  { screenKey: "REPORT_DASH_OVERVIEW", parentKey: "REPORT_DASH", label: "개요", depth: 3, order: 1, url: COMMON_URL, domain: "report.dashboard.overview" },
  { screenKey: "REPORT_DASH_TEAM", parentKey: "REPORT_DASH", label: "팀 현황", depth: 3, order: 2, url: COMMON_URL, domain: "report.dashboard.team" },
  { screenKey: "REPORT_DASH_PERSONAL", parentKey: "REPORT_DASH", label: "개인 현황", depth: 3, order: 3, url: COMMON_URL, domain: "report.dashboard.personal" },

  // REPORT_METRIC - 3depth (3)
  { screenKey: "REPORT_METRIC_KPI", parentKey: "REPORT_METRIC", label: "KPI", depth: 3, order: 1, url: COMMON_URL, domain: "report.metric.kpi" },
  { screenKey: "REPORT_METRIC_TREND", parentKey: "REPORT_METRIC", label: "추세", depth: 3, order: 2, url: COMMON_URL, domain: "report.metric.trend" },
  { screenKey: "REPORT_METRIC_COMPARE", parentKey: "REPORT_METRIC", label: "비교", depth: 3, order: 3, url: COMMON_URL, domain: "report.metric.compare" },

  // REPORT_AUDIT - 3depth (3)
  { screenKey: "REPORT_AUDIT_ACCESS", parentKey: "REPORT_AUDIT", label: "접속 기록", depth: 3, order: 1, url: COMMON_URL, domain: "report.audit.access" },
  { screenKey: "REPORT_AUDIT_CHANGE", parentKey: "REPORT_AUDIT", label: "변경 기록", depth: 3, order: 2, url: COMMON_URL, domain: "report.audit.change" },
  { screenKey: "REPORT_AUDIT_ERROR", parentKey: "REPORT_AUDIT", label: "오류 기록", depth: 3, order: 3, url: COMMON_URL, domain: "report.audit.error" },

  // REPORT_EXPORT - 3depth (3)
  { screenKey: "REPORT_EXPORT_EXCEL", parentKey: "REPORT_EXPORT", label: "엑셀", depth: 3, order: 1, url: COMMON_URL, domain: "report.export.excel" },
  { screenKey: "REPORT_EXPORT_PDF", parentKey: "REPORT_EXPORT", label: "PDF", depth: 3, order: 2, url: COMMON_URL, domain: "report.export.pdf" },
  { screenKey: "REPORT_EXPORT_API", parentKey: "REPORT_EXPORT", label: "API", depth: 3, order: 3, url: COMMON_URL, domain: "report.export.api" },
]

//업무
const sampleDomains = [
  'ops.tasks.all',
  'ops.tasks.my',
  'collab.notice.all',
  'report.metric.kpi',
]
const statuses = ['대기', '진행', '완료']

async function seedMenus() {
  // 1) 이번 seed 기준으로 “남길 메뉴 key 목록”
  const keepKeys = menus.map((m) => m.screenKey)

  // 2) keepKeys에 없는 메뉴는 DB에서 삭제 (DB를 seed와 동일하게 맞춤)
  await prisma.menu.deleteMany({
    where: { screenKey: { notIn: keepKeys } },
  })

  // 3) menus 배열을 한 줄씩 upsert (있으면 update, 없으면 create)
  for (const m of menus) {
    await prisma.menu.upsert({
      where: { screenKey: m.screenKey },
      update: { ...m, isActive: true },
      create: { ...m, isActive: true },
    })
  }

  const cnt = await prisma.menu.count()
  console.log(`✅ Seeded menus (synced): ${cnt}`)
}

async function seedWorkItems() {
  // (선택) 매번 seed할 때 중복으로 계속 쌓이는 게 싫으면 먼저 지우기
  await prisma.workItem.deleteMany()

  // 120개 생성
  const items = Array.from({ length: 120 }, (_, i) => ({
    domain: sampleDomains[i % sampleDomains.length],
    title: `업무 항목 ${i + 1}`,
    status: statuses[i % statuses.length],
    owner: ['Kim', 'Lee', 'Park'][i % 3],
  }))

  // createMany가 훨씬 빠름
  await prisma.workItem.createMany({ data: items })

  const cnt = await prisma.workItem.count()
  console.log(`✅ Seeded work items: ${cnt}`)
}

async function main() {
  await seedMenus()
  await seedWorkItems()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })