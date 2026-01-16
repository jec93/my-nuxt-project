<template>
  <div class="wrap">
    <a-typography-text class="sectionTitle">즐겨찾기</a-typography-text>
    <a-menu
      mode="inline"
      :items="favoriteItems"
      :selectedKeys="selectedKeys"
      @click="onFavoriteClick"
    />

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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// ===== 라우터
const router = useRouter()
const route = useRoute()

// ===== 즐겨찾기(지금은 하드코딩 유지, 추후 DB로 교체)
const favoriteItems = [
  { key: '/', label: '대시보드' },
  { key: '/menu', label: '메뉴 관리(예정)' },
]

// ===== DB 메뉴 로드
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
const onFavoriteClick = ({ key }) => {
  selectedKeys.value = [String(key)]
  router.push(String(key))
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
</style>
