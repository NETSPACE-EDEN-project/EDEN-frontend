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
  const notifications = ref([])

  const messagePagination = ref({
    current: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  const isLoading = ref(false)
  const error = ref(null)

  const currentRoomId = computed(() => currentRoom.value?.roomId)
  const hasChats = computed(() => chatList.value.length > 0)
  const isGroupChat = computed(() => currentRoom.value?.roomType === 'group')

  // ======= 聊天列表 / 房間 =======
  const setChatList = (list) => {
    chatList.value = list
  }

  const updateChatInList = (roomId, updates) => {
    const chatIndex = chatList.value.findIndex((c) => c.roomId === roomId)
    if (chatIndex !== -1) {
      chatList.value[chatIndex] = { ...chatList.value[chatIndex], ...updates }
    }
  }

  const setCurrentRoom = (room) => (currentRoom.value = room)
  const setCurrentRoomInfo = (info) => (roomInfo.value = info)
  const setMembers = (list) => (members.value = list)
  const setUserRole = (role) => (userRole.value = role)

  // ======= 訊息 =======
  const setMessages = (list) => {
    messages.value = list
  }

  const prependMessages = (list) => {
    const existingIds = new Set(messages.value.map((m) => m.id))
    const newMessages = list.filter((m) => !existingIds.has(m.id))
    messages.value = [...newMessages, ...messages.value]
  }

  const addMessage = (msg) => {
    if (msg.id && messages.value.find((m) => m.id === msg.id)) {
      console.warn('訊息已存在，跳過重複新增:', msg.id)
      return
    }

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

  const updateMessage = (messageId, updates) => {
    const messageIndex = messages.value.findIndex((m) => m.id === messageId)
    if (messageIndex !== -1) {
      messages.value[messageIndex] = { ...messages.value[messageIndex], ...updates }
    }
  }

  const updateLastMessage = (roomId, msg) => {
    updateChatInList(roomId, {
      lastMessage: msg.content,
      lastMessageAt: msg.createdAt,
    })
  }

  // ======= 分頁 =======
  const setMessagePagination = (pagination) => {
    messagePagination.value = {
      ...pagination,
      hasMore: pagination.current < pagination.totalPages,
    }
  }

  const incrementMessagePage = () => {
    if (messagePagination.value.hasMore) {
      messagePagination.value.current += 1
    }
  }

  // ======= 通知系統 =======
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification,
    }
    notifications.value.unshift(newNotification)

    // 限制通知數量
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
  }

  const markNotificationAsRead = (notificationId) => {
    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  const clearNotifications = () => (notifications.value = [])

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
    messagePagination.value = {
      current: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasMore: false,
    }
    clearError()
  }

  const reset = () => {
    chatList.value = []
    clearChatData()
    notifications.value = []
  }

  return {
    // 狀態
    chatList,
    currentRoom,
    roomInfo,
    members,
    userRole,
    messages,
    notifications,
    messagePagination,
    isLoading,
    error,

    // 計算屬性
    currentRoomId,
    hasChats,
    isGroupChat,

    // 方法
    setChatList,
    updateChatInList,
    setCurrentRoom,
    setCurrentRoomInfo,
    setMembers,
    setUserRole,
    setMessages,
    prependMessages,
    addMessage,
    updateMessage,
    updateLastMessage,
    setMessagePagination,
    incrementMessagePage,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    setLoading,
    setError,
    clearError,
    clearChatData,
    reset,
  }
})
