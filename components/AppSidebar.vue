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
                  <a-button size="small" danger @click="removeFavorite(item.screenKey)">삭제</a-button>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </a-modal>


    <a-divider style="margin: 12px 0;" />

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

<script setup>
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

  // 1~2depth는 url이 없으니 이동 X (펼침 전용)
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
      title: node.label,              // a-tree는 label이 아니라 title
      disabled: !leaf && node.depth !== 1 && node.depth !== 2 ? false : !leaf, 
      // 위 줄이 헷갈리면 아래처럼 단순하게:
      // disabled: !leaf,  // ✅ leaf만 체크 가능
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

// (선택) ← 버튼 기능: 지금은 비워둬도 됨
function removeSelectedFromFavorites() {
  // 나중에 “우측 리스트 선택” UX를 넣을 때 구현
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

</style>
