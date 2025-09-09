import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const userName = computed(() => user.value?.username || user.value?.email || '用戶')

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const setUser = (userData) => {
    user.value = userData
  }

  const clearError = () => {
    error.value = null
  }

  const clearAuth = () => {
    user.value = null
    clearError()
  }

  const updateUser = (userData) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    userName,
    setLoading,
    setError,
    clearError,
    setUser,
    clearAuth,
    updateUser,
  }
})
