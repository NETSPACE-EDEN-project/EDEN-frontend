import api from './api.js'

export const chatService = {
  async getChatListAPI() {
    const res = await api.get('/api/chat/chats')

    return res.data
  },

  async searchUsersAPI(keyword) {
    const res = await api.get('/api/chat/search', {
      params: { keyword },
    })
    return res.data
  },

  async startPrivateChatAPI(targetUserId) {
    const res = await api.post('/api/chat/private', { targetUserId })
    return res.data
  },

  async createGroupChatAPI(groupData) {
    const res = await api.post('/api/chat/group', groupData)
    return res.data
  },

  async getChatMessagesAPI(roomId, options = {}) {
    const res = await api.get(`/api/chat/rooms/${roomId}/messages`, {
      params: {
        page: options.page || 1,
        limit: options.limit || 50,
      },
    })
    return res.data
  },
}
