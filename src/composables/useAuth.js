import Swal from 'sweetalert2'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'
import { authService } from '../services/authService.js'

export function useAuth() {
  const authStore = useAuthStore()

  const { user, isAuthenticated, isLoading, userName, userId } = storeToRefs(authStore)

  const handleApiError = async (error) => {
    console.error('API 呼叫失敗', error)
    const errorObj = error.response?.data || {
      success: false,
      error: 'UnknownError',
      message: error.message || '操作失敗',
    }

    authStore.setError(errorObj)
    await Swal.fire('操作失敗', errorObj.message || '請稍後再試', 'error')

    return errorObj
  }

  const login = async (userData) => {
    if (!userData.email || !userData.password) {
      const errObj = { success: false, error: 'MissingInfo', message: '請填寫完整資訊' }
      await Swal.fire('錯誤', errObj.message, 'error')
      authStore.setError(errObj)
      return errObj
    }

    authStore.setLoading(true)
    authStore.clearError()

    try {
      const res = await authService.loginAPI(userData)

      if (res.success) {
        authStore.setUser(res.data.user)
        await Swal.fire('登入成功', res.message || '', 'success')
        return res
      } else {
        authStore.setError(res)
        await Swal.fire('登入失敗', res.message || '請稍後再試', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  const register = async (userData) => {
    if (!userData.email || !userData.password || !userData.username) {
      const errObj = { success: false, error: 'MissingInfo', message: '請填寫必要欄位' }
      await Swal.fire('錯誤', errObj.message, 'error')
      authStore.setError(errObj)
      return errObj
    }

    authStore.setLoading(true)
    authStore.clearError()

    try {
      const res = await authService.registerAPI(userData)

      if (res.success) {
        authStore.setUser(res.data.user)
        await Swal.fire('註冊成功', res.message || '請登入您的帳號', 'success')
        return res
      } else {
        authStore.setError(res)
        await Swal.fire('註冊失敗', res.message || '請稍後再試', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  const logout = async () => {
    authStore.setLoading(true)
    try {
      const res = await authService.logoutAPI()
      authStore.clearAuth()
      await Swal.fire('登出成功', res.message || '', 'success')
      return res
    } catch (err) {
      authStore.clearAuth()
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  const getCurrentUser = async () => {
    authStore.setLoading(true)
    try {
      const res = await authService.getCurrentUserAPI()
      if (res.success) {
        authStore.setUser(res.data.user)
        return res
      } else {
        authStore.setError(res)
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  const verifyAuthStatus = async () => {
    authStore.setLoading(true)
    try {
      const res = await authService.verifyAuthStatusAPI()

      if (res.success && res.data.isAuthenticated) {
        if (res.data.user) {
          authStore.setUser(res.data.user)
        } else if (!authStore.user) {
          await getCurrentUser()
        }
        return res
      } else {
        // 認證失敗時清除本地狀態
        authStore.clearAuth()
        authStore.setError(res)
        return res
      }
    } catch (err) {
      // 網路錯誤時也清除認證狀態
      authStore.clearAuth()
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  const verifyEmail = async (token) => {
    if (!token) {
      const errObj = { success: false, error: 'InvalidToken', message: '缺少驗證 Token' }
      authStore.setError(errObj)
      await Swal.fire('錯誤', errObj.message, 'error')
      return errObj
    }

    authStore.setLoading(true)
    authStore.clearError()

    try {
      const res = await authService.verifyEmailAPI(token)

      if (res.success) {
        if (res.data?.user) {
          authStore.setUser(res.data.user)
        }
        await Swal.fire('驗證成功', res.message || '您的 Email 已完成驗證', 'success')
        return res
      } else {
        authStore.setError(res)
        await Swal.fire('驗證失敗', res.message || '驗證連結無效或已過期', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  const resendEmail = async (email) => {
    if (!email) {
      const errObj = { success: false, error: 'MissingEmail', message: '請輸入 Email' }
      authStore.setError(errObj)
      await Swal.fire('錯誤', errObj.message, 'error')
      return errObj
    }

    authStore.setLoading(true)
    authStore.clearError()

    try {
      const res = await authService.resendEmailAPI(email)

      if (res.success) {
        await Swal.fire('成功', res.message || '驗證信已重新寄送', 'success')
        return res
      } else {
        authStore.setError(res)
        await Swal.fire('失敗', res.message || '寄送失敗', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      authStore.setLoading(false)
    }
  }

  return {
    login,
    register,
    logout,
    getCurrentUser,
    verifyAuthStatus,
    user,
    isAuthenticated,
    isLoading,
    userName,
    userId,
    verifyEmail,
    resendEmail,
    setError: authStore.setError,
    clearError: authStore.clearError,
  }
}
