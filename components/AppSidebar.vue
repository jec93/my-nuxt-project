<template>
  <div>
    <div class="logo">
      <span v-if="!collapsed">My Portal</span>
      <span v-else>MP</span>
    </div>

    <a-menu
      theme="dark"
      mode="inline"
      :selectedKeys="[selectedKey]"
      @click="onClick"
      :items="items"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()
const router = useRouter()

const items = [
  { key: '/', label: 'Home' },
  { key: '/dashboard', label: 'Dashboard' },
  { key: '/settings', label: 'Settings' },
]

const selectedKey = computed(() => route.path)

const onClick = ({ key }) => {
  router.push(key)
}
</script>

<style scoped>
.logo{
  height: 48px;
  margin: 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.12);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>
