<script setup>
import { buildMenuTree, buildMenuMap, getAncestorKeys } from '~/utils/menuTree'
import { toAntdMenuItems } from '~/utils/antdMenu'

const route = useRoute()

const { data } = await useFetch('/api/menus')
const flatMenus = computed(() => data.value?.menus ?? [])

const menuMap = computed(() => buildMenuMap(flatMenus.value))
const tree = computed(() => buildMenuTree(flatMenus.value))
const items = computed(() => toAntdMenuItems(tree.value))

// 선택/펼침 상태
const selectedKeys = ref([])
const openKeys = ref([])

// route 기반으로 현재 메뉴 선택 복원 (url=/work/grid & domain으로 매칭)
function syncSelectionFromRoute() {
  // 현재 라우트가 /work/grid?domain=... 형태라면 domain으로 menu를 찾는 게 깔끔함
  const domain = route.query.domain
  if (!domain) return

  const found = flatMenus.value.find(m => m.domain === domain && m.url)
  if (!found) return

  selectedKeys.value = [found.screenKey]
  openKeys.value = getAncestorKeys(found.screenKey, menuMap.value)
}

// 메뉴 로드 완료 후 1회 + 라우트 변경 시 동기화
watch([flatMenus, () => route.fullPath], () => {
  if (!flatMenus.value.length) return
  syncSelectionFromRoute()
}, { immediate: true })

const onClick = ({ key }) => {
  const menu = menuMap.value.get(key)
  if (!menu) return

  // leaf(3depth, url 있는 것)만 이동
  if (!menu.url) return

  // 펼침 상태 업데이트(부모 열기)
  openKeys.value = getAncestorKeys(menu.screenKey, menuMap.value)
  selectedKeys.value = [menu.screenKey]

  navigateTo({
    path: menu.url,
    query: { domain: menu.domain ?? '' },
  })
}

// antd open state controlled
const onOpenChange = (keys) => {
  openKeys.value = keys
}
</script>

<template>
  <a-menu
    mode="inline"
    :items="items"
    :selectedKeys="selectedKeys"
    :openKeys="openKeys"
    @click="onClick"
    @openChange="onOpenChange"
  />
</template>
