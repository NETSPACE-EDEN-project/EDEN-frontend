<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from './stores/auth.js'
import { useAuth } from './composables/useAuth.js'

import LoadingOverlay from './components/LoadingOverlay.vue'
import Navbar from './components/Navbar.vue'

const route = useRoute()
const authStore = useAuthStore()
const { verifyAuthStatus } = useAuth()

const showNavigation = computed(() => {
  const hideNavRoutes = ['/login', '/register']
  return !hideNavRoutes.includes(route.path)
})

const initializeApp = async () => {
  try {
    authStore.setLoading(true)
    await verifyAuthStatus()
  } catch (error) {
    console.error('初始化失敗:', error)
  } finally {
    authStore.setLoading(false)
  }
}

onMounted(() => {
  initializeApp()
})
</script>

<template>
  <!-- 浮水印背景 -->
  <div
    class="fixed inset-0 bg-[url('/brandImage.jpg')] bg-center bg-cover bg-no-repeat pointer-events-none z-0"
  ></div>

  <!-- 主要內容容器 -->
  <div class="fixed inset-0 z-10 overflow-x-hidden overflow-y-auto overscroll-contain bg-white/85">
    <!-- 導航欄 -->
    <Navbar v-if="showNavigation" class="fixed top-0 left-0 z-20 w-full" />

    <!-- 路由內容 -->
    <main class="pt-16">
      <router-view />
    </main>

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
