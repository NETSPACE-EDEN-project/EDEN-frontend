<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth.js'

const emit = defineEmits(['switch-to-signup'])
const router = useRouter()
const { login, isLoading } = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)

const handleSubmit = async () => {
  const result = await login({
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value,
  })

  if (result.success) {
    email.value = ''
    password.value = ''
    rememberMe.value = false

    router.push('/')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 表單 -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Email 輸入 -->
      <div>
        <label for="email" class="block mb-1 text-sm font-medium text-gray-700"> 電子信箱 </label>
        <input
          id="email"
          type="email"
          v-model="email"
          placeholder="請輸入您的電子信箱"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <!-- 密碼輸入 -->
      <div>
        <label for="password" class="block mb-1 text-sm font-medium text-gray-700"> 密碼 </label>
        <input
          id="password"
          type="password"
          v-model="password"
          placeholder="請輸入您的密碼"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <!-- 記住我 -->
      <div class="flex items-center">
        <input
          id="rememberMe"
          type="checkbox"
          v-model="rememberMe"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label for="rememberMe" class="block ml-2 text-sm text-gray-700"> 記住我 </label>
      </div>

      <!-- 登入按鈕 -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isLoading" class="flex items-center justify-center">
          <div
            class="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"
          ></div>
          登入中...
        </span>
        <span v-else>登入</span>
      </button>
    </form>

    <!-- 底部連結 -->
    <div class="text-sm text-center text-gray-600">
      還沒有帳號嗎？
      <button
        @click="emit('switch-to-signup')"
        class="font-medium text-blue-600 hover:text-blue-800"
      >
        立即註冊
      </button>
    </div>
  </div>
</template>
