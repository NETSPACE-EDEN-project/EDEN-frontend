<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { isAuthenticated, userName, logout } = useAuth()

const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  const result = await logout()
  if (result.success) {
    router.push('/')
  }
}

const handleMobileLogout = async () => {
  mobileMenuOpen.value = false
  await handleLogout()
}
</script>

<template>
  <nav class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-6xl px-4 mx-auto">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-2">
          <div
            class="flex items-center justify-center w-8 h-8 overflow-hidden bg-blue-600 rounded-full md:w-10 md:h-10"
          >
            <img src="/icon.jpg" alt="NETSPACE-EDEN icon" class="object-cover w-full h-full" />
          </div>
          <span class="text-xl font-bold text-blue-700 font-ui md:text-2xl">NETSPACE-EDEN</span>
        </router-link>

        <!-- 桌面版選單 -->
        <div class="items-center hidden space-x-6 md:flex">
          <!-- 已登入用戶 -->
          <div v-if="isAuthenticated" class="flex items-center space-x-4">
            <router-link to="/chat" class="font-medium text-gray-600 hover:text-blue-600">
              聊天室
            </router-link>
            <div class="flex items-center space-x-2">
              <div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span class="text-sm font-bold text-white">{{ userName[0].toUpperCase() }}</span>
              </div>
              <span class="text-gray-700">{{ userName }}</span>
            </div>
            <button @click="handleLogout" class="font-medium text-red-600 hover:text-red-800">
              登出
            </button>
          </div>

          <!-- 未登入用戶 -->
          <div v-else class="flex items-center space-x-4">
            <router-link to="/auth" class="font-medium text-gray-600 hover:text-blue-600">
              登入
            </router-link>
            <router-link
              to="/auth"
              class="px-4 py-2 text-white bg-blue-400 rounded hover:bg-blue-500"
            >
              註冊
            </router-link>
          </div>
        </div>

        <!-- 手機版選單按鈕 -->
        <div class="md:hidden">
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="text-gray-600 hover:text-blue-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 手機版下拉選單 -->
      <div v-if="mobileMenuOpen" class="py-4 border-t border-gray-200 md:hidden">
        <div class="space-y-3">
          <!-- 已登入手機選單 -->
          <div v-if="isAuthenticated" class="space-y-3">
            <div class="flex items-center px-2 space-x-2">
              <div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span class="text-sm font-bold text-white">{{ userName[0].toUpperCase() }}</span>
              </div>
              <span class="font-medium text-gray-700">{{ userName }}</span>
            </div>
            <router-link
              to="/chat"
              class="block px-2 py-1 text-gray-600 hover:text-blue-600"
              @click="mobileMenuOpen = false"
            >
              聊天室
            </router-link>
            <button
              @click="handleMobileLogout"
              class="block w-full px-2 py-1 text-left text-red-600 hover:text-red-800"
            >
              登出
            </button>
          </div>

          <!-- 未登入手機選單 -->
          <div v-else class="space-y-3">
            <router-link
              to="/auth"
              class="block px-2 py-1 text-gray-600 hover:text-blue-600"
              @click="mobileMenuOpen = false"
            >
              登入
            </router-link>
            <router-link
              to="/auth"
              class="block px-2 py-1 font-medium text-blue-600 hover:text-blue-800"
              @click="mobileMenuOpen = false"
            >
              註冊
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
