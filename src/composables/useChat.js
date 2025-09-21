// composables/useChat.js
import Swal from 'sweetalert2'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat.js'
import { chatService } from '../services/chatService.js'
import { useSocket } from './useSocket.js'

export function useChat() {
  const chatStore = useChatStore()
  const socket = useSocket() // 使用全局 Socket 封裝

  const {
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
    hasChats,
  } = storeToRefs(chatStore)

  // ======= 通用錯誤處理 =======
  const handleApiError = async (err) => {
    console.error('聊天 API 呼叫失敗', err)
    const errorObj = err.response?.data || {
      success: false,
      error: 'UnknownError',
      message: err.message || '操作失敗',
    }
    chatStore.setError(errorObj)
    await Swal.fire('操作失敗', errorObj.message || '請稍後再試', 'error')
    return errorObj
  }

  // ======= WebSocket 事件初始化 =======
  const initializeSocket = async () => {
    try {
      chatStore.setConnectionState('connecting')
      await socket.connect()

      // 訂閱全局事件，更新 store
      socket.on('message_received', (data) => {
        if (currentRoom.value?.roomId === data.roomId) chatStore.addMessage(data)
        chatStore.updateLastMessage(data.roomId, data)
      })

      socket.on('room_joined', async (data) => {
        if (data.messages) chatStore.setMessages(data.messages)
        if (data.onlineUsers) chatStore.setOnlineUsers(data.onlineUsers)

        if (data.roomInfo) {
          chatStore.setCurrentRoomInfo({
            ...data.roomInfo,
            members: data.roomInfo.members || [],
            userRole: data.roomInfo.userRole || 'member',
          })
        } else {
          // 若沒有 roomInfo，透過 API 再抓一次
          const res = await chatService.getRoomInfoAPI(data.roomId)
          if (res.success) {
            chatStore.setCurrentRoomInfo(res.data.room)
            chatStore.setMembers(res.data.members)
            chatStore.setUserRole(res.data.userRole)
          }
        }
      })

      socket.on('user_joined', (data) => {
        if (currentRoom.value?.roomId === data.roomId) {
          chatStore.setOnlineUsers([...onlineUsers.value, data])
        }
      })

      socket.on('user_left', (data) => {
        if (currentRoom.value?.roomId === data.roomId) {
          chatStore.setOnlineUsers(onlineUsers.value.filter((u) => u.userId !== data.userId))
        }
      })

      socket.on('user_typing', (data) => {
        if (currentRoom.value?.roomId === data.roomId) chatStore.addTypingUser(data)
      })

      socket.on('user_stop_typing', (data) => {
        if (currentRoom.value?.roomId === data.roomId) chatStore.removeTypingUser(data.userId)
      })

      socket.on('online_users_updated', (data) => {
        if (currentRoom.value?.roomId === data.roomId) chatStore.setOnlineUsers(data.users || [])
      })

      socket.on('auth_error', (data) => {
        console.error('WebSocket 認證錯誤:', data)
        Swal.fire('連接錯誤', '認證失敗，請重新登入', 'error')
      })

      socket.on('connection_established', () => {
        chatStore.setConnectionState('connected')
      })

      socket.on('connection_lost', () => {
        chatStore.setConnectionState('disconnected')
      })

      chatStore.setConnectionState('connected')
      return true
    } catch (err) {
      chatStore.setConnectionState('disconnected')
      console.error('初始化 Socket 失敗:', err)
      return false
    }
  }

  const cleanupSocket = () => {
    socket.offAll() // 假設 useSocket 封裝了全移除方法
  }

  const disconnectSocket = () => {
    cleanupSocket()
    socket.disconnect()
    chatStore.setConnectionState('disconnected')
  }

  // ======= 消息操作 =======
  const sendMessage = async (content, messageType = 'text', replyToId = null) => {
    if (!currentRoom.value) throw new Error('沒有選擇聊天室')
    if (!content?.trim()) throw new Error('消息內容不能為空')

    try {
      socket.sendMessage(currentRoom.value.roomId, content.trim(), messageType, replyToId)
      return { success: true }
    } catch (err) {
      return { success: false, error: await handleApiError(err) }
    }
  }

  const startTyping = () => currentRoom.value && socket.startTyping(currentRoom.value.roomId)
  const stopTyping = () => currentRoom.value && socket.stopTyping(currentRoom.value.roomId)
  const markMessagesAsRead = (messageIds = []) =>
    currentRoom.value && socket.markMessagesRead(currentRoom.value.roomId, messageIds)

  // ======= 房間操作 =======
  const setCurrentRoom = async (room) => {
    if (currentRoom.value) {
      socket.leaveRoom(currentRoom.value.roomId)
      chatStore.clearTypingUsers()
    }

    chatStore.setCurrentRoom(room)
    if (room) {
      socket.joinRoom(room.roomId)
      socket.getOnlineUsers(room.roomId)
    }
  }

  const clearChatData = () => {
    if (currentRoom.value) socket.leaveRoom(currentRoom.value.roomId)
    chatStore.clearChatData()
  }

  // ======= API 操作 =======
  const getChatList = async () => {
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.getChatListAPI()
      if (res.success) chatStore.setChatList(res.data.chats)
      else await Swal.fire('載入失敗', res.message || '無法載入聊天列表', 'error')
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const searchUsers = async (keyword) => {
    if (!keyword?.trim()) return handleApiError({ message: '請輸入搜尋關鍵字' })
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.searchUsersAPI(keyword.trim())
      if (res.success) return res.data.users
      else await Swal.fire('搜尋失敗', res.message || '搜尋用戶失敗', 'error')
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const startPrivateChat = async (targetUserId) => {
    if (!targetUserId) return handleApiError({ message: '請選擇聊天對象' })
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.startPrivateChatAPI(targetUserId)
      if (res.success) await Swal.fire('成功', res.message || '私人聊天室創建成功', 'success')
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const createGroupChat = async (groupData) => {
    if (!groupData.groupName?.trim()) return handleApiError({ message: '請輸入群組名稱' })
    if (!groupData.memberIds?.length) return handleApiError({ message: '請至少選擇一個成員' })
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.createGroupChatAPI(groupData)
      if (res.success) await Swal.fire('成功', res.message || '群組聊天室創建成功', 'success')
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const getChatMessages = async (roomId, options = {}) => {
    if (!roomId) return handleApiError({ message: '房間ID不能為空' })
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.getChatMessagesAPI(roomId, options)
      if (res.success) {
        if (options.page === 1) chatStore.setMessages(res.data.messages)
        else chatStore.prependMessages(res.data.messages)
        return { messages: res.data.messages, pagination: res.data.pagination }
      } else await Swal.fire('載入失敗', res.message || '載入訊息失敗', 'error')
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const getRoomInfo = async (roomId) => {
    if (!roomId) return handleApiError({ message: '房間ID不能為空' })
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.getRoomInfoAPI(roomId)
      if (res.success) {
        const { room, members: roomMembers, userRole: role } = res.data
        chatStore.setCurrentRoomInfo(room)
        chatStore.setMembers(roomMembers)
        chatStore.setUserRole(role)
        return res
      } else await Swal.fire('載入失敗', res.message || '載入房間資訊失敗', 'error')
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  return {
    // Socket
    initializeSocket,
    cleanupSocket,
    disconnectSocket,
    // 消息
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    // 房間
    setCurrentRoom,
    clearChatData,
    // API
    getChatList,
    searchUsers,
    startPrivateChat,
    createGroupChat,
    getChatMessages,
    getRoomInfo,
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
    hasChats,
  }
}
