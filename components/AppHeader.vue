<template>
  <div class="wrap">
    <a-button type="text" @click="$emit('toggle')" style="font-size:18px;">
      <MenuUnfoldOutlined v-if="collapsed" />
      <MenuFoldOutlined v-else />
    </a-button>

    <div class="right">
      <a-space>
        <a-tag color="blue">로그인됨</a-tag>
        <a-button @click="onLogout">로그아웃</a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup>
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'

defineProps({
  collapsed: { type: Boolean, default: false },
})

const onLogout = async () => {
  // 서버 로그아웃 API 만들어뒀다면 호출
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch (e) {
    
  }
  // 쿠키 직접 제거
  const token = useCookie('access_token')
  token.value = null

  await navigateTo('/login')
}
</script>

<style scoped>
.wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.right { display: flex; align-items: center; }
</style>
