import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

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
  (response) => {
    console.log(
      `API 回應: ${response.config.method.toUpperCase()} - ${response.config.url}`,
      response.data,
    )
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('認證失敗，請重新登入')
      window.location.href = '/login'
    } else {
      console.error(
        `API 錯誤: ${error.config?.method?.toUpperCase()} - ${error.config?.url}`,
        error.response.data,
      )
    }
    return Promise.reject(error)
  },
)

export default api
