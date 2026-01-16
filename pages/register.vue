<template>
  <div class="wrap">
    <a-card class="card" :bordered="false">
      <div class="title">
        <a-typography-title :level="3" style="margin:0;">회원가입</a-typography-title>
        <a-typography-text type="secondary">
          아이디/비밀번호를 입력해주세요
        </a-typography-text>
      </div>

      <a-form layout="vertical" :model="form" @finish="onFinish">
        <a-form-item
          label="아이디"
          name="id"
          :rules="[{ required: true, message: '아이디를 입력해주세요' }]"
        >
          <a-input v-model:value="form.id" placeholder="id" />
        </a-form-item>

        <a-form-item
          label="비밀번호"
          name="password"
          :rules="[{ required: true, message: '비밀번호를 입력해주세요' }]"
        >
          <a-input-password v-model:value="form.password" placeholder="password" />
        </a-form-item>

        <a-form-item
          label="비밀번호 확인"
          name="password2"
          :rules="[{ required: true, message: '비밀번호 확인을 입력해주세요' }]"
        >
          <a-input-password v-model:value="form.password2" placeholder="password confirm" />
        </a-form-item>

        <a-alert
          v-if="error"
          type="error"
          show-icon
          :message="error"
          style="margin-bottom: 12px;"
        />
        <a-alert
          v-if="success"
          type="success"
          show-icon
          :message="success"
          style="margin-bottom: 12px;"
        />

        <a-button type="primary" html-type="submit" block :loading="loading">
          회원가입
        </a-button>

        <div class="bottom">
          <a-typography-text type="secondary">이미 계정이 있나요?</a-typography-text>
          <a @click="goLogin">로그인</a>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth' })

const form = reactive({
  id: '',
  password: '',
  password2: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const onFinish = async () => {
  error.value = ''
  success.value = ''

  if (form.password !== form.password2) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { id: form.id, password: form.password },
    })
    success.value = '회원가입 성공! 로그인 해주세요.'
    // 바로 로그인 화면으로 보내고 싶으면 아래 사용
    // await navigateTo('/login')
  } catch (e) {
    error.value = '회원가입 실패'
  } finally {
    loading.value = false
  }
}

const goLogin = () => navigateTo('/login')
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
