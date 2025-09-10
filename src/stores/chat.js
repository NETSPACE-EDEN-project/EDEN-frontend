import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
  const chatList = ref([])
  const currentRoom = ref(null)
  const messages = ref([])
  const onlineUsers = ref([])
  const typingUsers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const currentRoomId = computed(() => currentRoom.value?.roomId)
  const hasChats = computed(() => chatList.value.length > 0)

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const setChatList = (chats) => {
    chatList.value = chats
  }

  const setCurrentRoom = (room) => {
    currentRoom.value = room
  }

  const setMessages = (messageList) => {
    messages.value = messageList
  }

  const prependMessages = (messageList) => {
    messages.value = [...messageList, ...messages.value]
  }

  const addMessage = (message) => {
    messages.value.push(message)
  }

  const setOnlineUsers = (users) => {
    onlineUsers.value = users
  }

  const addTypingUser = (user) => {
    if (!typingUsers.value.some((u) => u.userId === user.userId)) {
      typingUsers.value.push(user)
    }
  }

  const removeTypingUser = (userId) => {
    typingUsers.value = typingUsers.value.filter((u) => u.userId !== userId)
  }

  const clearTypingUsers = () => {
    typingUsers.value = []
  }

  const updateLastMessage = (roomId, message) => {
    const chat = chatList.value.find((c) => c.roomId === roomId)
    if (chat) {
      chat.lastMessage = message.content
      chat.lastMessageAt = message.createdAt
    }
  }

  const clearChatData = () => {
    currentRoom.value = null
    messages.value = []
    onlineUsers.value = []
    clearTypingUsers()
    clearError()
  }

  return {
    chatList,
    currentRoom,
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
