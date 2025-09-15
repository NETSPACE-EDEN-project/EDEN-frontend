import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '../services/authService.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isLoggedOut = ref(false)

  const clearAuthCookies = () => {
    const cookiesToClear = ['auth_token', 'user_display', 'remember_me']
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; sameSite=lax;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  }

  const isAuthenticated = computed(() => !!user.value)

  const userName = computed(() => {
    if (!user.value) return '用戶'
    return user.value.username || user.value.email || '用戶'
  })

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const setUser = (userData) => {
    user.value = userData
    isLoggedOut.value = false
  }

  const clearError = () => {
    error.value = null
  }

  const clearAuth = () => {
    user.value = null
    clearError()
    isLoggedOut.value = true
    clearAuthCookies()
  }

  const updateUser = (userData) => {
    if (user.value) user.value = { ...user.value, ...userData }
  }

  const initializeAuth = async () => {
    setLoading(true)
    try {
      const res = await authService.getCurrentUserAPI()
      if (res.success) setUser(res.data.user)
      else clearAuth()
    } catch {
      clearAuth()
    } finally {
      setLoading(false)
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
    initializeAuth,
    isLoggedOut,
  }
})
