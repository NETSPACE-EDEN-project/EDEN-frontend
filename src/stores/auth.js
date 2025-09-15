import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isLoggedOut = ref(false)

  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }

  const getUserFromCookie = () => {
    const cookie = getCookie('user_display')
    if (!cookie) return null

    try {
      let decoded = decodeURIComponent(cookie)

      if (decoded.startsWith('s:')) {
        decoded = decoded.slice(2)
      }

      const lastDotIndex = decoded.lastIndexOf('.')
      if (lastDotIndex > -1) {
        decoded = decoded.slice(0, lastDotIndex)
      }
      const payload = JSON.parse(decoded)
      return payload
    } catch (err) {
      console.error('解析 user_display cookie 失敗', err)
      return null
    }
  }

  const clearAuthCookies = () => {
    const cookiesToClear = ['auth_token', 'user_display', 'remember_me']
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; sameSite=lax;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  }

  const isAuthenticated = computed(() => {
    if (isLoggedOut.value) {
      return false
    }
    if (user.value) {
      return true
    }

    const cookieUser = getUserFromCookie()
    const result = !!cookieUser
    return result
  })

  const userName = computed(() => {
    if (user.value?.username) return user.value.username
    if (user.value?.email) return user.value.email

    const cookieUser = getUserFromCookie()
    if (cookieUser?.username) return cookieUser.username
    if (cookieUser?.email) return cookieUser.email

    return '用戶'
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

  const initializeAuth = () => {
    if (!user.value) {
      const cookieUser = getUserFromCookie()
      if (cookieUser) {
        user.value = cookieUser
      }
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
    getUserFromCookie,
    initializeAuth,
    isLoggedOut,
  }
})
