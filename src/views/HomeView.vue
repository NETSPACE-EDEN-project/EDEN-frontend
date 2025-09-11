<script setup>
import { useAuth } from '../composables/useAuth.js'

const { isAuthenticated, userName } = useAuth()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <!-- Logo 區域 -->
    <div class="mb-12 text-center">
      <div
        class="flex items-center justify-center w-24 h-24 mx-auto mb-6 overflow-hidden bg-blue-600 rounded-full"
      >
        <img src="/icon.jpg" alt="NETSPACE-EDEN icon" class="object-cover w-full h-full" />
      </div>
      <h1 class="mb-4 text-4xl font-bold text-blue-700">NETSPACE-EDEN</h1>
      <p class="text-xl text-gray-600">線上交流平臺</p>
    </div>

    <!-- 操作按鈕 -->
    <div class="flex flex-col gap-4 mb-8 sm:flex-row">
      <router-link
        v-if="!isAuthenticated"
        to="/login"
        class="px-8 py-3 font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        開始聊天
      </router-link>
      <router-link
        v-else
        to="/chat"
        class="px-8 py-3 font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        進入聊天室
      </router-link>
      <router-link
        v-if="!isAuthenticated"
        to="/register"
        class="px-8 py-3 font-medium text-center text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"
      >
        註冊帳號
      </router-link>
    </div>

    <!-- 歡迎訊息 -->
    <div v-if="isAuthenticated" class="p-6 text-center rounded-lg bg-white/80">
      <h3 class="mb-2 text-lg font-medium text-gray-800">歡迎回來，{{ userName }}</h3>
      <p class="text-gray-600">繼續與朋友們聊天吧！</p>
    </div>
  </div>
</template>
