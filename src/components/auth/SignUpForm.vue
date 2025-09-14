<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits(['switch-to-login'])
const { register, isLoading } = useAuth()

const formData = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  birthday: '',
  phone: '',
})

const handleSubmit = async () => {
  if (formData.value.password !== formData.value.confirmPassword) {
    await Swal.fire('錯誤', '密碼與確認密碼不相符', 'error')
    return
  }

  const result = await register({
    email: formData.value.email,
    username: formData.value.username,
    password: formData.value.password,
    confirmPassword: formData.value.confirmPassword,
    birthday: formData.value.birthday,
    phone: formData.value.phone,
  })

  if (result.success) {
    formData.value = {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      birthday: '',
      phone: '',
    }
    emit('switch-to-login')
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
          v-model="formData.email"
          placeholder="請輸入您的電子信箱"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <!-- 用戶名稱輸入 -->
      <div>
        <label for="username" class="block mb-1 text-sm font-medium text-gray-700">
          用戶名稱
        </label>
        <input
          id="username"
          type="text"
          v-model="formData.username"
          placeholder="請輸入您的用戶名稱"
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
          v-model="formData.password"
          placeholder="至少 8 個字元，包含大小寫字母和數字"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <!-- 確認密碼輸入 -->
      <div>
        <label for="confirmPassword" class="block mb-1 text-sm font-medium text-gray-700">
          確認密碼
        </label>
        <input
          id="confirmPassword"
          type="password"
          v-model="formData.confirmPassword"
          placeholder="再次輸入您的密碼"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <!-- 生日輸入 -->
      <div>
        <label for="birthday" class="block mb-1 text-sm font-medium text-gray-700">
          生日(選填)
        </label>
        <input
          id="birthday"
          type="date"
          v-model="formData.birthday"
          placeholder="請輸入您的生日(yyyy-mm-dd)"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- 電話輸入 -->
      <div>
        <label for="phone" class="block mb-1 text-sm font-medium text-gray-700"> 電話(選填) </label>
        <input
          id="phone"
          type="tel"
          v-model="formData.phone"
          placeholder="請輸入您的電話"
          class="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- 註冊按鈕 -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isLoading" class="flex items-center justify-center">
          <div
            class="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"
          ></div>
          註冊中...
        </span>
        <span v-else>創建帳號</span>
      </button>
    </form>

    <!-- 底部連結 -->
    <div class="text-sm text-center text-gray-600">
      已經有帳號了嗎？
      <button
        @click="emit('switch-to-login')"
        class="font-medium text-blue-600 hover:text-blue-800"
      >
        立即登入
      </button>
    </div>
  </div>
</template>
