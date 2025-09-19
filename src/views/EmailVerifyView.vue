<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const { verifyEmail, resendEmail } = useAuth()
const router = useRouter()
const route = useRoute()

const isVerifying = ref(true)
const verificationResult = ref('')
const errorMessage = ref('')
const showResendForm = ref(false)
const email = ref('')
const isResending = ref(false)

const handleverifyEmail = async () => {
  const token = route.query.token

  if (!token) {
    verificationResult.value = 'failed'
    errorMessage.value = '無效的驗證連結'
    isVerifying.value = false
    return
  }

  const res = await verifyEmail(token)
  if (res.success) {
    verificationResult.value = 'success'
  } else {
    verificationResult.value = 'failed'
    errorMessage.value = res.message || '驗證連結無效或已過期'
  }
  isVerifying.value = false
}

const handleResendEmail = async () => {
  isResending.value = true
  const res = await resendEmail(email.value)
  if (res.success) {
    showResendForm.value = false
  }
  isResending.value = false
}

const goToLogin = () => {
  router.push('/auth')
}

onMounted(() => {
  handleverifyEmail()
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4 bg-transparent">
    <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <!-- 載入中 -->
      <div v-if="isVerifying" class="text-center">
        <div
          class="w-12 h-12 mx-auto mb-4 border-2 border-blue-200 rounded-full animate-spin border-t-blue-600"
        ></div>
        <h2 class="mb-2 text-xl font-semibold">驗證中...</h2>
        <p class="text-gray-600">請稍候</p>
      </div>

      <!-- 驗證成功 -->
      <div v-else-if="verificationResult === 'success'" class="text-center">
        <div
          class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full"
        >
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 class="mb-2 text-xl font-semibold">驗證成功</h2>
        <p class="mb-6 text-gray-600">您的信箱已成功驗證</p>
        <button
          @click="goToLogin"
          class="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          前往登入
        </button>
      </div>

      <!-- 驗證失敗 -->
      <div v-else-if="verificationResult === 'failed'" class="text-center">
        <div
          class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full"
        >
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </div>
        <h2 class="mb-2 text-xl font-semibold">驗證失敗</h2>
        <p class="mb-6 text-gray-600">{{ errorMessage }}</p>

        <!-- 重新寄送表單 -->
        <div v-if="showResendForm" class="mb-4 space-y-3">
          <input
            v-model="email"
            type="email"
            placeholder="請輸入您的信箱"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div class="flex space-x-2">
            <button
              @click="handleResendEmail"
              :disabled="!email || isResending"
              class="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ isResending ? '寄送中...' : '重新寄送' }}
            </button>
            <button
              @click="showResendForm = false"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div v-else class="flex space-x-2">
          <button
            @click="goToLogin"
            class="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            返回登入
          </button>
          <button
            @click="showResendForm = true"
            class="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            重寄驗證信
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
