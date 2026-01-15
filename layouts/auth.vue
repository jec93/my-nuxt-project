<template>
  <div class="auth-wrap">
    <slot />
  </div>
</template>

<style scoped>
.auth-wrap{
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f5f5f5;
}
</style>
