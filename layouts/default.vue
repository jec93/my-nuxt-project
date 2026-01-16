<template>
  <a-layout style="min-height: 100vh;">
    <a-layout-sider collapsible v-model:collapsed="collapsed" width="260">
      <div class="logo">My App</div>
      <AppSidebar />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <AppHeader />
      </a-layout-header>

      <a-layout-content class="content">
        <NuxtPage />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import AppSidebar from '~/components/AppSidebar.vue'
import AppHeader from '~/components/AppHeader.vue'

const collapsed = ref(false)
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
</style>
