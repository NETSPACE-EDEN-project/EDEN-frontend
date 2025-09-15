import axios from 'axios'

const API_BASE_URL = 'https://eden-backend.zeabur.app'

console.log('Current environment:', import.meta.env.MODE)
console.log(API_BASE_URL)
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('All env vars:', import.meta.env)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

let router = null
let authStore = null

const importDependencies = async () => {
  if (!router) {
    const routerModule = await import('../router')
    router = routerModule.default
  }
  if (!authStore) {
    const { useAuthStore } = await import('../stores/auth')
    authStore = useAuthStore()
  }
}

api.interceptors.request.use(
  (config) => {
    console.log(`API 請求: ${config.method.toUpperCase()} - ${config.url}`)
    return config
  },
  (error) => {
    console.error('API 請求錯誤:', error)
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  async (response) => {
    const tokenRefreshed = response.headers['x-token-refreshed']
    if (tokenRefreshed === 'true') {
      console.log('Token 已自動刷新')

      await importDependencies()

      if (authStore) {
        authStore.initializeAuth()
        console.log('認證狀態已同步')
      }
    }

    console.log(
      `API 回應: ${response.config.method.toUpperCase()} - ${response.config.url}`,
      response.data,
    )

    return response
  },
  async (error) => {
    console.error(
      `API 錯誤: ${error.config?.method?.toUpperCase()} - ${error.config?.url}`,
      error.response?.data || error.message,
    )

    if (error.response?.status === 401) {
      console.warn('認證失敗，清除認證狀態')

      await importDependencies()

      if (authStore) {
        authStore.clearAuth()
      }

      if (router && router.currentRoute.value.path !== '/auth') {
        router.push('/auth')
      }
    }

    return Promise.reject(error)
  },
)

export default api
