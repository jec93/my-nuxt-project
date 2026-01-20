<script setup>
import { message } from 'ant-design-vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 라우터
const router = useRouter()
const route = useRoute()

// DB 메뉴 로드
const { data } = await useFetch('/api/menus')
const flatMenus = computed(() => data.value?.menus ?? [])

// ===== flat -> tree
function buildMenuTree(list = []) {
  const map = new Map()
  const roots = []

  list.forEach(item => {
    map.set(item.screenKey, { ...item, children: [] })
  })

  map.forEach(node => {
    if (node.parentKey && map.has(node.parentKey)) {
      map.get(node.parentKey).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortRec = nodes => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    nodes.forEach(n => sortRec(n.children))
  }
  sortRec(roots)

  return roots
}

const favorites = ref([]) // [{screenKey,label,url,domain,depth}]
const favoriteMenuItems = computed(() =>
  favorites.value.map(f => ({
    key: f.screenKey,
    label: f.label,
  }))
)

async function loadFavorites() {
  favorites.value = await $fetch('/api/favorites/favorites')
}
onMounted(loadFavorites)

function toAntdMenuItems(tree = []) {
  const convert = (node) => ({
    key: node.screenKey,
    label: node.label,
    children: node.children?.length ? node.children.map(convert) : undefined,
  })
  return tree.map(convert)
}

const tree = computed(() => buildMenuTree(flatMenus.value))
const menuItems = computed(() => toAntdMenuItems(tree.value))

// key -> menu row
const menuMap = computed(() => {
  const m = new Map()
  flatMenus.value.forEach(x => m.set(x.screenKey, x))
  return m
})

// ===== 선택/펼침 상태
const selectedKeys = ref([route.path])
const openKeys = ref([])

function getAncestorKeys(key) {
  const ancestors = []
  let cur = menuMap.value.get(key)
  while (cur?.parentKey) {
    ancestors.push(cur.parentKey)
    cur = menuMap.value.get(cur.parentKey)
  }
  return ancestors
}

// route의 domain으로 메뉴 선택 복원 (/work/grid?domain=...)
function syncSelectionFromRoute() {
  const domain = route.query.domain
  if (!domain) return

  const found = flatMenus.value.find(m => m.domain === domain && m.url)
  if (!found) return

  selectedKeys.value = [found.screenKey]
  openKeys.value = getAncestorKeys(found.screenKey)
}

watch([flatMenus, () => route.fullPath], () => {
  if (!flatMenus.value.length) return
  syncSelectionFromRoute()
}, { immediate: true })

// ===== openKeys 제어 (현재 네 로직 유지)
function getLevelKeys(items, level = 1, map = {}) {
  for (const item of items) {
    if (item.key) map[item.key] = level
    if (item.children) getLevelKeys(item.children, level + 1, map)
  }
  return map
}

const levelKeys = computed(() => getLevelKeys(menuItems.value))

const onOpenChange = (nextOpenKeys) => {
  const currentOpenKey = nextOpenKeys.find((k) => !openKeys.value.includes(k))
  if (currentOpenKey !== undefined) {
    const repeatIndex = nextOpenKeys
      .filter((k) => k !== currentOpenKey)
      .findIndex((k) => levelKeys.value[k] === levelKeys.value[currentOpenKey])

    openKeys.value = nextOpenKeys
      .filter((_, index) => index !== repeatIndex)
      .filter((k) => levelKeys.value[k] <= levelKeys.value[currentOpenKey])
  } else {
    openKeys.value = nextOpenKeys
  }
}

// ===== 클릭 핸들러 분리
function onFavoriteClick({ key }) {
  const fav = favorites.value.find(f => f.screenKey === key)
  if (!fav) return
  // leaf 클릭 이동: url + domain
  if (fav.url === '/work/grid') {
    router.push({ path: fav.url, query: { domain: fav.domain } })
  } else {
    router.push(fav.url)
  }
}

const onMenuClick = ({ key }) => {
  const menu = menuMap.value.get(String(key))
  if (!menu) return

  // 1~2depth는 펼침
  if (!menu.url) return

  selectedKeys.value = [menu.screenKey]
  openKeys.value = getAncestorKeys(menu.screenKey)

  // 공통 화면 이동 + domain으로 내용 분기
  router.push({
    path: menu.url,
    query: { domain: menu.domain ?? '' },
  })
}

// ======================
// 즐겨찾기 모달
// ======================
const favoriteModalOpen = ref(false)

// 좌측 트리 체크
const checkedKeys = ref([])

// 우측 즐겨찾기 draft (모달에서 편집용)
const favDraft = ref([])

// leaf 판단: 지금 너 구조는 leaf만 url+domain이 있음
function isLeafMenu(m) {
  return m && m.depth === 3 && !!m.url && !!m.domain
}

// 모달용 트리: 1/2depth는 체크 비활성화, leaf만 체크 가능하게
const favoriteMenuTree = computed(() => {
  const convert = (node) => {
    const leaf = isLeafMenu(node)
    return {
      key: node.screenKey,
      title: node.label,
      disabled: !leaf && node.depth !== 1 && node.depth !== 2 ? false : !leaf, 
      // disabled: !leaf
      children: node.children?.length ? node.children.map(convert) : undefined,
    }
  }
  return tree.value.map(convert)
})

async function openFavoriteModal() {
  // 최신 즐겨찾기 로드 후 복사
  await loadFavorites()
  favDraft.value = [...favorites.value]
  checkedKeys.value = []
  favoriteModalOpen.value = true
}

// 체크한 leaf를 즐겨찾기에 추가(중복 방지)
function addCheckedToFavorites() {
  const keys = Array.isArray(checkedKeys.value)
    ? checkedKeys.value
    : (checkedKeys.value?.checked || [])

  const leafMap = new Map(
    flatMenus.value
      .filter(isLeafMenu)
      .map(m => [m.screenKey, m])
  )

  const exist = new Set(favDraft.value.map(f => f.screenKey))

  for (const k of keys) {
    const m = leafMap.get(k)
    if (!m) continue
    if (exist.has(m.screenKey)) continue

    favDraft.value.push({
      screenKey: m.screenKey,
      label: m.label,
      url: m.url,
      domain: m.domain,
      depth: m.depth,
    })
    exist.add(m.screenKey)
  }
}

// 우측 리스트에서 개별 삭제
function removeFavorite(screenKey) {
  favDraft.value = favDraft.value.filter(f => f.screenKey !== screenKey)
}

// 저장(전체 덮어쓰기 PUT)
async function saveFavorites() {
  const menuKeys = favDraft.value.map(f => f.screenKey)

  await $fetch('/api/favorites/favorites', {
    method: 'PUT',
    body: { menuKeys },
  })

  favoriteModalOpen.value = false
  await loadFavorites()
}

const currentUserId = computed(() => 'admin') 

async function shareFavorite(item) {
  console.log('shareFavorite payload', {
    toUserId: currentUserId.value,
    menuKey: item?.screenKey,
    item,
  })  
  try {
    if (!currentUserId.value) {
      message.warning('로그인 정보(userId)를 찾을 수 없어요')
      return
    }

    await $fetch('/api/share/send', {
      method: 'POST',
      body: {
        toUserId: currentUserId.value,
        menuKey: item.screenKey,
        message: `즐겨찾기 공유: ${item.label}`,
      },
    })
    message.success('공유 알림을 보냈어요')
  } catch (e) {
    console.log(e)
    message.error('공유에 실패했어요')
  }
}

function closeFavoriteModal() {
  favoriteModalOpen.value = false
}

onMounted(() => {
  loadFavorites()
  window.addEventListener('favorites:changed', loadFavorites)
})
onBeforeUnmount(() => {
  window.removeEventListener('favorites:changed', loadFavorites)
})

const shareModalOpen = ref(false)
const shareTargetId = ref(null)   // 선택한 유저 id
const shareUsers = ref([])
const shareLoading = ref(false)
const shareQuery = ref('')
const shareItem = ref(null)       // 어떤 즐겨찾기를 공유하는지

async function openShareModal(item) {
  shareItem.value = item
  shareTargetId.value = null
  shareQuery.value = ''
  shareModalOpen.value = true
  await loadUsers()
}

async function loadUsers() {
  shareLoading.value = true
  try {
    const res = await $fetch('/api/users/list', {
      query: shareQuery.value ? { q: shareQuery.value } : {},
    })
    shareUsers.value = res.users || []
  } catch (e) {
    console.log(e)
    message.error('사용자 목록을 불러오지 못했어요')
  } finally {
    shareLoading.value = false
  }
}

let shareSearchTimer = null
watch(shareQuery, () => {
  clearTimeout(shareSearchTimer)
  shareSearchTimer = setTimeout(loadUsers, 250) // 간단 디바운스
})

async function confirmShare() {
  if (!shareItem.value) return
  if (!shareTargetId.value) {
    message.warning('공유 대상을 선택해 주세요')
    return
  }

  try {
    await $fetch('/api/share/send', {
      method: 'POST',
      body: {
        toUserId: shareTargetId.value,
        menuKey: shareItem.value.screenKey,
        message: `즐겨찾기 공유: ${shareItem.value.label}`,
      },
    })
    message.success('공유 알림을 보냈어요')
    shareModalOpen.value = false
  } catch (e) {
    message.error('공유에 실패했어요')
  }
}
</script>

<style scoped>
.wrap{
  padding: 8px;
}
.sectionTitle{
  display:block;
  padding: 6px 8px;
  color: rgba(255,255,255,0.7);
}
.favHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 6px 8px;
}

.favTitle{
  font-weight: 700;
  color: #ffffff;          /* 라이트 기준 */
  cursor: pointer;
  user-select: none;
}

.favTitle:hover{
  text-decoration: underline;
}

.favActions {
  display: flex;
  gap: 4px;
}

.userList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
  padding-right: 6px;
}

.userRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  cursor: pointer;
}

.userText {
  min-width: 0;
}

.userName {
  font-weight: 700;
  line-height: 1.2;
}

.userSub {
  font-size: 12px;
  opacity: 0.75;
}
</style>

<template>
  <div class="wrap">
    <div class="favHeader">
      <!-- 즐겨찾기 텍스트를 클릭하면 dropdown -->
      <a-dropdown trigger="click">
        <span class="favTitle">
          즐겨찾기 ▼
        </span>

        <template #overlay>
          <a-menu :items="favoriteMenuItems" @click="onFavoriteClick" />
        </template>
      </a-dropdown>

      <!-- 톱니 버튼은 별도로 -->
      <a-button size="small" @click="openFavoriteModal">⚙</a-button>
    </div>

<!-- 즐겨찾기 관리 모달 부분 -->
    <a-modal
      v-model:open="favoriteModalOpen"
      title="즐겨찾기 관리"
      width="900px"
      :maskClosable="false"
      @ok="saveFavorites"
    >
      <a-row :gutter="12">
        <!-- 좌: 전체 메뉴 트리 -->
        <a-col :span="10">
          <a-card size="small" title="전체 메뉴">
            <a-tree
              checkable
              :tree-data="favoriteMenuTree"
              v-model:checkedKeys="checkedKeys"
              :checkStrictly="true"
            />
          </a-card>
        </a-col>

        <!-- 중: 화살표 -->
        <a-col :span="4" style="display:flex;align-items:center;justify-content:center;gap:8px;flex-direction:column;">
          <a-button @click="addCheckedToFavorites">→</a-button>
          <a-button @click="removeSelectedFromFavorites">←</a-button>
        </a-col>

        <!-- 우: 즐겨찾기 리스트 -->
        <a-col :span="10">
          <a-card size="small" title="즐겨찾기">
            <a-list :data-source="favDraft" bordered>
              <template #renderItem="{ item }">
                <a-list-item>
                  <div style="flex:1">{{ item.label }}</div>
                  <div class="favActions">
                    <!-- ✅ 공유 버튼 -->
                    <a-tooltip title="공유 알림 보내기">
                      <a-button type="text" size="small" @click="openShareModal(item)">
                        공유
                      </a-button>
                    </a-tooltip>

                    <!-- 삭제 버튼 -->
                    <a-tooltip title="즐겨찾기에서 제거">
                      <a-button
                        size="small"
                        danger
                        @click="removeFavorite(item.screenKey)"
                      >
                        삭제
                      </a-button>
                    </a-tooltip>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </a-modal>
    <a-modal
      v-model:open="shareModalOpen"
      title="공유 대상 선택"
      :destroyOnClose="true"
      @ok="confirmShare"
    >
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a-input
          v-model:value="shareQuery"
          placeholder="이름 또는 아이디 검색"
          allow-clear
        />

        <a-spin :spinning="shareLoading">
          <a-radio-group v-model:value="shareTargetId" style="width:100%">
            <div v-if="shareUsers.length === 0">
              <a-empty description="사용자가 없습니다." />
            </div>

            <div v-else class="userList">
              <label v-for="u in shareUsers" :key="u.id" class="userRow">
                <a-radio :value="u.id" />
                <div class="userText">
                  <div class="userName">{{ u.name }}</div>
                  <div class="userSub">{{ u.loginId }}</div>
                </div>
              </label>
            </div>
          </a-radio-group>
        </a-spin>

        <div v-if="shareItem" style="opacity:.8; font-size:12px;">
          공유 항목: {{ shareItem.label }}
        </div>
      </div>
    </a-modal>

    <a-divider style="margin: 12px 0;" />

    <!-- 전체 메뉴 -->

    <a-typography-text class="sectionTitle">전체 메뉴</a-typography-text>
    <a-menu
      mode="inline"
      :items="menuItems"
      :openKeys="openKeys"
      :selectedKeys="selectedKeys"
      @openChange="onOpenChange"
      @click="onMenuClick"
    />
  </div>
</template>