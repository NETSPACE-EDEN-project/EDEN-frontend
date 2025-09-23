<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from './stores/auth.js'
import { useAuth } from './composables/useAuth.js'
import { useChat } from './composables/useChat.js'

import Navbar from './components/Navbar.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { verifyAuthStatus, checkTokenStatus } = useAuth()
const chat = useChat()

const showNavigation = computed(() => {
  const hideNavRoutes = ['/auth', '/login', '/register']
  return !hideNavRoutes.includes(route.path)
})

const mainClass = computed(() => {
  const noPaddingRoutes = ['/auth', '/login', '/register', '/verify-email']
  return noPaddingRoutes.includes(route.path) ? '' : 'pt-16'
})

let tokenCheckInterval = null

const startTokenCheckInterval = () => {
  if (tokenCheckInterval) return
  tokenCheckInterval = setInterval(
    async () => {
      if (authStore.isAuthenticated) {
        console.log('定時檢查 token...')
        const result = await checkTokenStatus()
        if (!result) {
          router.push('/auth')
        }
      }
    },
    15 * 60 * 1000,
  )
}

const stopTokenCheckInterval = () => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval)
    tokenCheckInterval = null
  }
}

const initializeApp = async () => {
  authStore.setLoading(true)
  try {
    authStore.initializeAuth()
    await verifyAuthStatus()

    if (authStore.isAuthenticated) {
      await chat.initializeSocket()
      startTokenCheckInterval()
    }
  } catch (error) {
    console.error('初始化失敗:', error)
    router.push('/auth')
  } finally {
    authStore.setLoading(false)
  }
}

watch(
  () => authStore.isAuthenticated,
  async (newVal) => {
    if (newVal) {
      await chat.initializeSocket()
      startTokenCheckInterval()
    } else {
      stopTokenCheckInterval()
    }
  },
)

onMounted(() => {
  initializeApp()
})

onUnmounted(() => {
  stopTokenCheckInterval()
})
</script>

<template>
  <!-- 浮水印背景 -->
  <div
    class="fixed inset-0 bg-[url('/brandImage.jpg')] bg-center bg-cover bg-no-repeat pointer-events-none z-0"
  ></div>

  <div
    :class="[
      'fixed inset-0 z-10 flex flex-col bg-white/85',
      route.path === '/auth' ? 'overflow-y-auto' : 'overflow-hidden',
    ]"
  >
    <!-- 導航欄 -->
    <Navbar v-if="showNavigation" class="fixed top-0 left-0 z-20 w-full" />

    <div v-if="authStore.isReady" class="flex flex-1 h-full">
      <!-- Router view -->
      <main
        :class="[
          'flex-1 flex flex-col',
          mainClass,
          route.path === '/auth' ? 'overflow-y-auto' : '',
        ]"
      >
        <router-view />
      </main>
    </div>

    <!-- 全域載入覆蓋 -->
    <LoadingOverlay :show="authStore.isLoading" message="載入中..." />
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  -webkit-overflow-scrolling: touch;
}

* {
  box-sizing: border-box;
}
</style>
