<template>
  <a-layout class="app">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :width="240"
      class="sider"
    >
      <AppSidebar :collapsed="collapsed" />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <AppHeader :collapsed="collapsed" @toggle="collapsed = !collapsed" />
      </a-layout-header>

      <a-layout-content class="content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import AppHeader from '~/components/AppHeader.vue'
import AppSidebar from '~/components/AppSidebar.vue'

const collapsed = ref(false)
</script>

<style scoped>
.app { min-height: 100vh; }
.sider { background: #001529; }
.header {
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}
.content { padding: 16px; background: #f5f5f5; min-height: calc(100vh - 64px); }
</style>
