<template>
  <div class="wrap">
    <a-card class="card" :bordered="false">
      <div class="title">
        <a-typography-title :level="3" style="margin:0;">로그인</a-typography-title>
        <a-typography-text type="secondary">
          계정으로 로그인해주세요
        </a-typography-text>
      </div>

      <a-form
        layout="vertical"
        :model="form"
        @finish="onFinish"
      >
        <a-form-item
          label="아이디"
          name="id"
          :rules="[{ required: true, message: '아이디를 입력해주세요' }]"
        >
          <a-input v-model:value="form.id" placeholder="id">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="비밀번호"
          name="password"
          :rules="[{ required: true, message: '비밀번호를 입력해주세요' }]"
        >
          <a-input-password
            v-model:value="form.password"
            placeholder="pw (예: 1234)"
          />
        </a-form-item>

        <a-alert
          v-if="error"
          type="error"
          show-icon
          :message="error"
          style="margin-bottom: 12px;"
        />

        <a-button
          type="primary"
          html-type="submit"
          block
          :loading="loading"
        >
          로그인
        </a-button>

        <div class="bottom">
          <a-typography-text type="secondary">
            계정이 없나요?
          </a-typography-text>
          <a @click="goRegister">회원가입</a>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { UserOutlined } from '@ant-design/icons-vue'

definePageMeta({ layout: 'auth' })

const form = reactive({ id: '', password: '' })
const loading = ref(false)
const error = ref('')

const token = useCookie('access_token')
onMounted(async () => {
  if (token.value) await navigateTo('/')
})

const onFinish = async () => {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { id: form.id, password: form.password },
    })

    await nextTick()
    console.log('login success, going home')
    await navigateTo('/')
    console.log('navigated')
  } catch (e) {
    error.value = '로그인 실패: 아이디/비밀번호를 확인해주세요.'
  } finally {
    loading.value = false
  }
}

const goRegister = () => navigateTo('/register')
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f5f5f5;
}
.card {
  width: 380px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.title {
  margin-bottom: 16px;
}
.bottom {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
