<script setup>
import AppSidebar from '~/components/AppSidebar.vue'
import AppHeader from '~/components/AppHeader.vue'
import { useRouter } from 'nuxt/app';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'

const router = useRouter()

function clickLogo(){
  router.push({path : '/'})
}

const collapsed = ref(false)

const inbox = ref([])
const drawerOpen = ref(false)
const loading = ref(false)
let timer = null

const inboxCount = computed(() => inbox.value.length)

const showBanner = computed(() => inbox.value.length > 0)

async function loadInbox() {
  try {
    const res = await $fetch('/api/share/inbox')
    inbox.value = res.items || []
  } catch (e) {
    //
  }
}

onMounted(() => {
  loadInbox()
  timer = setInterval(loadInbox, 30000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

function openInboxDrawer() {
  drawerOpen.value = true
}

// 권한 체크 후 grid 이동
async function acceptShare(item) {
  if (!item?.domain) return

  loading.value = true
  try {
    // READ 처리
    await $fetch(`/api/share/inbox/${item.id}`, {
      method: 'PATCH',
      body: { status: 'READ' },
    })

    // 리스트 갱신
    await loadInbox()

    // 권한 체크
    const p = await $fetch('/api/permissions/check', { query: { domain: item.domain } })

    if (!p?.allowed) {
      message.warning('권한이 없어서 이동할 수 없습니다.')
      return
    }

    // 이동
    router.push(`/work/grid?domain=${encodeURIComponent(item.domain)}`)
  } catch (e) {
    console.log(e)
    message.error('처리에 실패했어요')
  } finally {
    loading.value = false
  }
}

async function rejectShare(item) {
  loading.value = true
  try {
    await $fetch(`/api/share/inbox/${item.id}`, {
      method: 'PATCH',
      body: { status: 'DISMISSED' },
    })
    await loadInbox()
    message.success('거절 처리했습니다')
  } catch (e) {
    console.log(e)
    message.error('거절 처리에 실패했어요')
  } finally {
    loading.value = false
  }
}

async function requestPermission(domain) {
  try {
    const res = await $fetch('/api/permissions/request', {
      method: 'POST',
      body: { domain },
    })
    if (res?.reason === 'ALREADY_ALLOWED') {
      message.info('이미 권한이 있습니다.')
    } else {
      message.success('권한 요청을 보냈어요.')
    }
  } catch (e) {
    message.error('권한 요청에 실패했어요.')
  }
}
</script>

<style scoped>
.logo{
  height: 48px;
  display:flex;
  align-items:center;
  padding: 0 16px;
  color: #fff;
  font-weight: 700;
}

.logo:hover{
  cursor: pointer;
}
.header{
  padding: 0 16px;
  display:flex;
  align-items:center;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.content{
  padding: 16px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
}
.inboxList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inboxCard {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  padding: 10px;
}

.inboxTop {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.who {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role {
  opacity: 0.7;
  margin-left: 6px;
}

.time {
  font-size: 12px;
  opacity: 0.65;
  white-space: nowrap;
}

.what .label {
  font-weight: 700;
  margin-bottom: 4px;
}

.what .msg {
  font-size: 12px;
  opacity: 0.85;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 10px;
}
</style>

<template>
  <a-layout style="min-height: 100vh;">
    <a-layout-sider collapsible v-model:collapsed="collapsed" width="260">
      <div class="logo" @click="clickLogo">My App</div>
      <AppSidebar />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <AppHeader />
      </a-layout-header>
      <!--공유 알림 베너-->
      <a-alert
        v-if="showBanner"
        type="info"
        banner
        :message="`공유된 항목 ${inboxCount}개가 도착했어요`"
      >
        <template #action>
          <a-button type="link" @click="openInboxDrawer">확인</a-button>
        </template>
      </a-alert>
      <a-layout-content class="content">
        <NuxtPage />
      </a-layout-content>
      <!-- ✅ 인박스 Drawer -->
      <a-drawer
        v-model:open="drawerOpen"
        :get-container="false"
        title="공유 받은 항목"
        placement="right"
        :width="420"
      >
        <a-spin :spinning="loading">
          <a-empty v-if="inboxCount === 0" description="새 알림이 없습니다." />

          <div v-else class="inboxList">
            <div v-for="item in inbox" :key="item.id" class="inboxCard">
              <div class="inboxTop">
                <div class="who">
                  <b>{{ item.fromLoginId }}</b>
                  <span class="role" v-if="item.fromRole">({{ item.fromRole }})</span>
                </div>
                <div class="time">{{ new Date(item.createdAt).toLocaleString() }}</div>
              </div>

              <div class="what">
                <div class="label">{{ item.menuLabel }}</div>
                <div class="msg" v-if="item.message">{{ item.message }}</div>
              </div>

              <div class="actions">
                <!-- 수락(권한 체크 포함) -->
                <a-button type="primary" size="small" @click="acceptShare(item)">
                  수락
                </a-button>
                <a-tooltip title="권한이 있으면 업무 화면으로 이동합니다.">
                  <a-button size="small" @click="router.push(`/work/grid?domain=${encodeURIComponent(item.domain)}`)">
                    이동
                  </a-button>
                </a-tooltip>

                <a-tooltip title="권한이 없으면 요청을 보냅니다.">
                  <a-button size="small" @click="requestPermission(item.domain)">
                    권한요청
                  </a-button>
                </a-tooltip>

                <a-tooltip title="이 알림을 숨깁니다.">
                  <a-button size="small" @click="rejectShare(item)">
                    거절
                  </a-button>
                </a-tooltip>
              </div>
            </div>
          </div>
        </a-spin>
      </a-drawer>
    </a-layout>
  </a-layout>
</template>