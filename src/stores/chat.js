// stores/chat.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
  const chatList = ref([])
  const currentRoom = ref(null)
  const roomInfo = ref(null)
  const members = ref([])
  const userRole = ref(null)

  const messages = ref([])
  const onlineUsers = ref([])
  const typingUsers = ref([])

  const isLoading = ref(false)
  const error = ref(null)

  const currentRoomId = computed(() => currentRoom.value?.roomId)
  const hasChats = computed(() => chatList.value.length > 0)

  // ======= 聊天列表 / 房間 =======
  const setChatList = (list) => (chatList.value = list)
  const setCurrentRoom = (room) => (currentRoom.value = room)
  const setCurrentRoomInfo = (info) => (roomInfo.value = info)
  const setMembers = (list) => (members.value = list)
  const setUserRole = (role) => (userRole.value = role)

  // ======= 訊息 =======
  const setMessages = (list) => (messages.value = list)
  const prependMessages = (list) => (messages.value = [...list, ...messages.value])

  const addMessage = (msg) => {
    // 檢查是否已存在相同 ID 的訊息
    if (msg.id && messages.value.find((m) => m.id === msg.id)) {
      console.warn('訊息已存在，跳過重複新增:', msg.id)
      return
    }

    // 如果沒有 ID，用 content + timestamp 做簡單去重
    const isDuplicate = messages.value.some(
      (m) =>
        m.content === msg.content &&
        m.senderId === msg.senderId &&
        Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 1000, // 1秒內
    )

    if (!isDuplicate) {
      messages.value.push(msg)
    }
  }

  const updateLastMessage = (roomId, msg) => {
    const chat = chatList.value.find((c) => c.roomId === roomId)
    if (chat) {
      chat.lastMessage = msg.content
      chat.lastMessageAt = msg.createdAt
    }
  }

  // ======= 在線 / 打字 =======
  const setOnlineUsers = (users) => (onlineUsers.value = users)

  const addTypingUser = (user) => {
    if (!typingUsers.value.some((u) => u.userId === user.userId)) {
      typingUsers.value.push(user)
    }
  }

  const removeTypingUser = (userId) => {
    typingUsers.value = typingUsers.value.filter((u) => u.userId !== userId)
  }

  const clearTypingUsers = () => (typingUsers.value = [])

  // ======= Loading / Error =======
  const setLoading = (loading) => (isLoading.value = loading)
  const setError = (err) => (error.value = err)
  const clearError = () => (error.value = null)

  // ======= 清除聊天室資料 =======
  const clearChatData = () => {
    currentRoom.value = null
    roomInfo.value = null
    members.value = []
    userRole.value = null
    messages.value = []
    onlineUsers.value = []
    clearTypingUsers()
    clearError()
  }

  return {
    // 狀態
    chatList,
    currentRoom,
    roomInfo,
    members,
    userRole,
    messages,
    onlineUsers,
    typingUsers,
    isLoading,
    error,

    // 計算屬性
    currentRoomId,
    hasChats,

    // 方法
    setChatList,
    setCurrentRoom,
    setCurrentRoomInfo,
    setMembers,
    setUserRole,
    setMessages,
    prependMessages,
    addMessage,
    updateLastMessage,
    setOnlineUsers,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers,
    setLoading,
    setError,
    clearError,
    clearChatData,
  }
})
