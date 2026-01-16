<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const domain = computed(() => String(route.query.domain || ''))
const hasValidDomain = computed(()=> !!domain.value)

// domain -> title
const titleMap = {
  'ops.tasks.all': '전체 작업',
  'ops.tasks.my': '내 작업',
  'collab.notice.all': '전체 공지',
  'report.metric.kpi': 'KPI',
}

const pageTitle = computed(() => titleMap[domain.value] || '업무 화면')

// loading/spin
const loading = ref(false)

// filters (ERP 느낌: 폼처럼)
const filters = ref({
  keyword: '',
  status: null,
  range: null, // range-picker value 그대로 둠(실데이터 붙일 때 변환)
})

const statusOptions = [
  { label: '대기', value: '대기' },
  { label: '진행', value: '진행' },
  { label: '완료', value: '완료' },
]

// table state
const rows = ref([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
})

// selection (ERP 느낌: 일괄처리)
const selectedRowKeys = ref([])
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => (selectedRowKeys.value = keys),
}))

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '제목', dataIndex: 'title', key: 'title' },
  { title: '상태', dataIndex: 'status', key: 'status', width: 120 },
  { title: '담당', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '등록일', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
]

function rowKey(r) {
  return r.id
}

// KPI 요약
const summary = computed(() => {
  const total = pagination.value.total || rows.value.length
  const inProgress = rows.value.filter(r => r.status === '진행').length
  const done = rows.value.filter(r => r.status === '완료').length
  return { total, inProgress, done }
})

async function fetchRowsByDomain(d, { keyword, status, page, pageSize }) {
  return await $fetch('/api/work/items', {
    query: {
      domain: d,
      keyword: keyword || '',
      status: status || '',
      page,
      pageSize,
    },
  })
}

async function load() {
  if (!hasValidDomain.value) {
    rows.value = []
    pagination.value.total = 0
    return
  }

  loading.value = true
  try {
    selectedRowKeys.value = []

    const res = await fetchRowsByDomain(domain.value, {
      keyword: filters.value.keyword?.trim(),
      status: filters.value.status,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })

    rows.value = res.rows
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

function onTableChange(p) {
  pagination.value.current = p.current
  pagination.value.pageSize = p.pageSize
  load()
}

function resetFilters() {
  filters.value.keyword = ''
  filters.value.status = null
  filters.value.range = null
  pagination.value.current = 1
  load()
}

function bulkAction() {
  // 지금은 더미: 선택된 row ids로 뭔가 처리하는 느낌만
  console.log('bulkAction keys:', selectedRowKeys.value)
}

// domain 바뀌면 상태 리셋
watch(domain, () => {
  selectedRowKeys.value = []
  pagination.value.current = 1
  load()
}, { immediate: true })
</script>

<style>
  @import './grid.css';
</style>

<template>
  <div class="wrap">
    <!--Breadcrumb-->
    <a-breadcrumb style="margin-bottom: 12px">
      <a-breadcrumb-item>업무</a-breadcrumb-item>
      <a-breadcrumb-item>그리드</a-breadcrumb-item>
      <a-breadcrumb-item>{{ pageTitle }}</a-breadcrumb-item>
    </a-breadcrumb>

    <!--Header-->
    <div class="pageHeader">
      <div>
        <a-typography-title :level="3" style="margin: 0">
          {{ pageTitle }}
        </a-typography-title>
        <a-typography-text type="secondary">
          domain: {{ domain || '(none)' }}
        </a-typography-text>
      </div>
      
      <a-space>
        <a-button @click="resetFilters">초기화</a-button>
        <a-button @click="load">조회</a-button>
        <a-button type="primary" :disabled="!selectedRowKeys.length" @click="bulkAction">
          일괄처리
        </a-button>
      </a-space>
    </div>

    <a-spin :spinning="loading">
      <!--Filter Bar-->
      <a-card style="margin-bottom: 12px">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="8">
            <div class="field">
              <div class="label">검색어</div>
              <a-input
                v-model:value="filters.keyword"
                placeholder="제목/ID 검색"
                allow-clear
                @pressEnter="load"
              />
            </div>
          </a-col>

          <a-col :xs="24" :md="8">
            <div class="field">
              <div class="label">상태</div>
              <a-select
                v-model:value="filters.status"
                style="width: 100%"
                placeholder="전체"
                allow-clear
                :options="statusOptions"
              />
            </div>
          </a-col>

          <a-col :xs="24" :md="8">
            <div class="field">
              <div class="label">기간</div>
              <a-range-picker v-model:value="filters.range" style="width: 100%" />
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!--Summary-->
      <a-row :gutter="[12, 12]" style="margin-bottom: 12px">
        <a-col :xs="24" :md="8">
          <a-card>
            <a-typography-text type="secondary">전체</a-typography-text>
            <div class="kpi">{{ summary.total }}</div>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card>
            <a-typography-text type="secondary">진행</a-typography-text>
            <div class="kpi">{{ summary.inProgress }}</div>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card>
            <a-typography-text type="secondary">완료</a-typography-text>
            <div class="kpi">{{ summary.done }}</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- Table -->
      <a-card>
        <template v-if="!hasValidDomain">
          <a-empty description="메뉴를 선택해 주세요." />
        </template>

        <template v-else-if="rows.length === 0">
          <a-empty description="데이터가 없습니다." />
        </template>

        <template v-else>
          <a-table
            :columns="columns"
            :dataSource="rows"
            :rowKey="rowKey"
            :pagination="pagination"
            @change="onTableChange"
            :rowSelection="rowSelection"
          />
        </template>
      </a-card>
    </a-spin>
  </div>
</template>