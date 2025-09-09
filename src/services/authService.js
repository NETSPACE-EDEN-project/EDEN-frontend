import api from './api.js'

export const authService = {
  async login(userData) {
    const res = await api.post('/api/auth/login', userData)

    return res.data
  },

  async logout() {
    const res = await api.post('/api/auth/logout')

    return res.data
  },

  async register(userData) {
    const res = await api.post('/api/auth/register', userData)

    return res.data
  },

  async getCurrentUser() {
    const res = await api.get('/api/auth/me')

    return res.data
  },

  async checkAuthStatus() {
    const res = await api.get('/api/auth/verify')

    return res.data
  },
}
