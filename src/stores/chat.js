import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
  const chatList = ref([])
  const currentRoom = ref(null)
  const roomInfo = ref(null) // 新增：房間資訊
  const members = ref([]) // 新增：房間成員
  const userRole = ref(null) // 新增：自己在房間的角色
  const messages = ref([])
  const onlineUsers = ref([])
  const typingUsers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const currentRoomId = computed(() => currentRoom.value?.roomId)
  const hasChats = computed(() => chatList.value.length > 0)

  // ======= 通用狀態方法 =======
  const setLoading = (loading) => {
    isLoading.value = loading
  }
  const setError = (errorMessage) => {
    error.value = errorMessage
  }
  const clearError = () => {
    error.value = null
  }

  // ======= 聊天室列表 =======
  const setChatList = (chats) => {
    chatList.value = chats
  }
  const setCurrentRoom = (room) => {
    currentRoom.value = room
  }

  // ======= 房間資訊 =======
  const setCurrentRoomInfo = (info) => {
    roomInfo.value = info
  }
  const setMembers = (list) => {
    members.value = list
  }
  const setUserRole = (role) => {
    userRole.value = role
  }

  // ======= 訊息操作 =======
  const setMessages = (list) => {
    messages.value = list
  }
  const prependMessages = (list) => {
    messages.value = [...list, ...messages.value]
  }
  const addMessage = (message) => {
    messages.value.push(message)
  }

  // ======= 在線用戶 =======
  const setOnlineUsers = (users) => {
    onlineUsers.value = users
  }

  // ======= 正在輸入用戶 =======
  const addTypingUser = (user) => {
    if (!typingUsers.value.some((u) => u.userId === user.userId)) typingUsers.value.push(user)
  }
  const removeTypingUser = (userId) => {
    typingUsers.value = typingUsers.value.filter((u) => u.userId !== userId)
  }
  const clearTypingUsers = () => {
    typingUsers.value = []
  }

  // ======= 聊天室最後訊息更新 =======
  const updateLastMessage = (roomId, message) => {
    const chat = chatList.value.find((c) => c.roomId === roomId)
    if (chat) {
      chat.lastMessage = message.content
      chat.lastMessageAt = message.createdAt
    }
  }

  // ======= 清除聊天室相關資料 =======
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
    currentRoomId,
    hasChats,

    setLoading,
    setError,
    clearError,
    setChatList,
    setCurrentRoom,
    setCurrentRoomInfo,
    setMembers,
    setUserRole,
    setMessages,
    prependMessages,
    addMessage,
    setOnlineUsers,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers,
    updateLastMessage,
    clearChatData,
  }
})
