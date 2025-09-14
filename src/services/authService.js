import api from './api.js'

export const authService = {
  async loginAPI(userData) {
    const res = await api.post('/api/auth/login', userData)

    return res.data
  },

  async logoutAPI() {
    const res = await api.post('/api/auth/logout')

    return res.data
  },

  async registerAPI(userData) {
    const res = await api.post('/api/auth/register', userData)

    return res.data
  },

  async getCurrentUserAPI() {
    const res = await api.get('/api/auth/me')

    return res.data
  },

  async verifyAuthStatusAPI() {
    const res = await api.get('/api/auth/verify')

    return res.data
  },

  async refreshTokenAPI() {
    const res = await api.post('/api/auth/refresh')

    return res.data
  },
}
