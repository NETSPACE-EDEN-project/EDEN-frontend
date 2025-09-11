<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const authMode = ref('login')

onMounted(() => {
  const mode = route.query.mode
  if (mode === 'signup') {
    authMode.value = 'signup'
  } else {
    authMode.value = 'login'
  }
})

const showLogin = () => {
  authMode.value = 'login'
  router.replace({ query: { mode: 'login' } })
}

const showSignUp = () => {
  authMode.value = 'signup'
  router.replace({ query: { mode: 'signup' } })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md">
      <!-- Logo 區域 -->
      <div class="mb-8 text-center">
        <div
          class="flex items-center justify-center w-16 h-16 mx-auto mb-4 overflow-hidden bg-blue-600 rounded-full"
        >
          <img src="/icon.jpg" alt="NETSPACE-EDEN icon" class="object-cover w-full h-full" />
        </div>
        <h1 class="text-2xl font-bold text-blue-700">NETSPACE-EDEN</h1>
      </div>

      <!-- 認證卡片 -->
      <div class="p-6 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl">
        <!-- 切換標籤 -->
        <div class="flex p-1 mb-6 bg-gray-100 rounded-lg">
          <button
            @click="showLogin"
            :class="[
              'flex-1 py-2 px-4 rounded-md font-medium transition-all',
              authMode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600',
            ]"
          >
            登入
          </button>
          <button
            @click="showSignUp"
            :class="[
              'flex-1 py-2 px-4 rounded-md font-medium transition-all',
              authMode === 'signup'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-blue-600',
            ]"
          >
            註冊
          </button>
        </div>

        <!-- 表單區域 -->
        <div class="min-h-[300px]">
          <LoginForm v-if="authMode === 'login'" @switch-to-signup="showSignUp" />
          <SignUpForm v-if="authMode === 'signup'" @switch-to-login="showLogin" />
        </div>
      </div>

      <!-- 底部連結 -->
      <div class="mt-6 text-center">
        <router-link to="/" class="font-medium text-blue-600 hover:text-blue-800">
          回到首頁
        </router-link>
      </div>
    </div>
  </div>
</template>
