<script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { Column } from '@antv/g2plot'

  /* ======================
    KPI (Mock)
    ====================== */
  const kpis = [
    { key: 'total', label: '전체 업무', value: 128 },
    { key: 'pending', label: '대기', value: 23 },
    { key: 'progress', label: '진행중', value: 71 },
    { key: 'done', label: '완료', value: 34 },
  ]

  /* ======================
    Chart (Mock)
    ====================== */
  const chartEl = ref(null)
  let plot = null

  const chartData = [
    { type: '대기', value: 23 },
    { type: '진행중', value: 71 },
    { type: '완료', value: 34 },
  ]

  onMounted(() => {
    if (!chartEl.value) return

    plot = new Column(chartEl.value, {
      data: chartData,
      xField: 'type',
      yField: 'value',
      height: 260,
      // 색상은 기본값으로 두면 됨(원하면 지정 가능)
      label: {
        position: 'middle',
        style: { fill: '#fff' },
      },
      xAxis: { label: { autoHide: true } },
      meta: {
        value: { alias: '건수' },
      },
    })

    plot.render()
  })

  onBeforeUnmount(() => {
    if (plot) {
      plot.destroy()
      plot = null
    }
  })

  /* ======================
    Recent Shares (Mock)
    ====================== */
  const recentShares = [
    { id: 1, from: 'admin', label: '공지사항 관리' },
    { id: 2, from: 'manager', label: 'Q&A 관리' },
    { id: 3, from: 'admin', label: '협업 게시판' },
  ]
</script>

<template>
  <div class="wrap">
    <h1>해당 업무 대쉬보드는 ant-design기반의 퍼블리싱만 되어있습니다</h1>
    <!-- KPI -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="6" v-for="k in kpis" :key="k.key">
        <a-card>
          <div class="kpiLabel">{{ k.label }}</div>
          <div class="kpiValue">{{ k.value }}</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Chart + Share -->
    <a-row :gutter="16">
      <a-col :span="14">
        <a-card title="업무 상태 현황">
          <div ref="chartEl" />
        </a-card>
      </a-col>

      <a-col :span="10">
        <a-card title="최근 공유 알림">
          <a-list size="small" :data-source="recentShares">
            <template #renderItem="{ item }">
              <a-list-item>
                <b>{{ item.from }}</b> 님이
                <span style="margin-left: 4px">{{ item.label }}</span>을 공유했습니다
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- Guide -->
    <a-card style="margin-top: 16px">
      <a-typography-title :level="5" style="margin-top: 0">안내</a-typography-title>
      <ul class="guide">
        <li>사이드바 메뉴와 즐겨찾기는 개인화됩니다.</li>
        <li>즐겨찾기 메뉴는 다른 사용자에게 공유할 수 있습니다.</li>
        <li>공유 받은 메뉴는 권한 확인 후 접근 가능합니다.</li>
        <li>권한이 없는 경우 권한 신청이 가능합니다.</li>
      </ul>
    </a-card>
  </div>
</template>

<style scoped>
.wrap {
  padding: 16px;
}

.kpiLabel {
  font-size: 13px;
  opacity: 0.75;
}
.kpiValue {
  font-size: 28px;
  font-weight: 700;
  margin-top: 6px;
}

.guide {
  padding-left: 18px;
}
.guide li {
  margin-bottom: 6px;
  opacity: 0.9;
}
</style>
