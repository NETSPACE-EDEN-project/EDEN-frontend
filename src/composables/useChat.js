// composables/useChat.js
import Swal from 'sweetalert2'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat.js'
import { useSocketStore } from '../stores/socket.js'
import { chatService } from '../services/chatService.js'

export function useChat() {
  const chatStore = useChatStore()
  const socketStore = useSocketStore()

  // Chat Store 狀態
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

  // Socket Store 狀態
  const { isConnected, connectionState, connectionStatus } = storeToRefs(socketStore)

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

  // ======= Socket 初始化 =======
  const initializeSocket = async () => {
    try {
      await socketStore.connect()

      // 清理舊事件監聽器
      socketStore.offAll()

      // 設置事件監聽器
      setupSocketListeners()

      // 檢查是否有儲存的房間ID，自動恢復
      const savedRoomId = sessionStorage.getItem('currentRoomId')
      if (savedRoomId) {
        await restoreRoom(savedRoomId)
      }

      return true
    } catch (err) {
      console.error('Socket 初始化失敗:', err)
      return false
    }
  }

  const setupSocketListeners = () => {
    // 收到新訊息
    socketStore.on('message_received', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        chatStore.addMessage(data)
      }
      chatStore.updateLastMessage(data.roomId, data)
    })

    // 成功加入房間
    socketStore.on('room_joined', async (data) => {
      if (data.messages) chatStore.setMessages(data.messages)
      if (data.onlineUsers) chatStore.setOnlineUsers(data.onlineUsers)

      // 如果沒有房間詳細資訊，透過 API 取得
      if (data.roomInfo) {
        chatStore.setCurrentRoomInfo(data.roomInfo)
        chatStore.setMembers(data.roomInfo.members || [])
        chatStore.setUserRole(data.roomInfo.userRole || 'member')
      } else {
        await fetchRoomInfo(data.roomId)
      }
    })

    // 用戶加入房間
    socketStore.on('user_joined', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        const newUsers = [...onlineUsers.value.filter((u) => u.userId !== data.userId), data]
        chatStore.setOnlineUsers(newUsers)
      }
    })

    // 用戶離開房間
    socketStore.on('user_left', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        chatStore.setOnlineUsers(onlineUsers.value.filter((u) => u.userId !== data.userId))
      }
    })

    // 用戶開始輸入
    socketStore.on('user_typing', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        chatStore.addTypingUser(data)
      }
    })

    // 用戶停止輸入
    socketStore.on('user_stop_typing', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        chatStore.removeTypingUser(data.userId)
      }
    })

    // 線上用戶更新
    socketStore.on('online_users_updated', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        chatStore.setOnlineUsers(data.users || [])
      }
    })

    // 認證錯誤
    socketStore.on('auth_error', (data) => {
      console.error('WebSocket 認證錯誤:', data)
      Swal.fire('連接錯誤', '認證失敗，請重新登入', 'error')
    })
  }

  // 恢復房間狀態（刷新後自動加入）
  const restoreRoom = async (roomId) => {
    try {
      const res = await chatService.getRoomInfoAPI(roomId)
      if (res.success) {
        chatStore.setCurrentRoom({ roomId, roomName: res.data.room.roomName })
        chatStore.setCurrentRoomInfo(res.data.room)
        chatStore.setMembers(res.data.members)
        chatStore.setUserRole(res.data.userRole)

        // Socket 加入房間
        socketStore.joinRoom(roomId)
        socketStore.getOnlineUsers(roomId)

        // 載入最近訊息
        await getChatMessages(roomId, { page: 1, limit: 50 })
      }
    } catch (err) {
      console.error('恢復房間失敗:', err)
      sessionStorage.removeItem('currentRoomId')
    }
  }

  const fetchRoomInfo = async (roomId) => {
    try {
      const res = await chatService.getRoomInfoAPI(roomId)
      if (res.success) {
        chatStore.setCurrentRoomInfo(res.data.room)
        chatStore.setMembers(res.data.members)
        chatStore.setUserRole(res.data.userRole)
      }
    } catch (err) {
      console.error('取得房間資訊失敗:', err)
    }
  }

  const cleanupSocket = () => {
    socketStore.offAll()
  }

  const disconnectSocket = () => {
    cleanupSocket()
    socketStore.disconnect()
  }

  // ======= 訊息操作 =======
  const sendMessage = async (content, messageType = 'text', replyToId = null) => {
    if (!currentRoom.value) throw new Error('沒有選擇聊天室')
    if (!content?.trim()) throw new Error('訊息內容不能為空')

    try {
      socketStore.sendMessage(currentRoom.value.roomId, content.trim(), messageType, replyToId)
      return { success: true }
    } catch (err) {
      return { success: false, error: await handleApiError(err) }
    }
  }

  const startTyping = () => {
    if (currentRoom.value) {
      socketStore.startTyping(currentRoom.value.roomId)
    }
  }

  const stopTyping = () => {
    if (currentRoom.value) {
      socketStore.stopTyping(currentRoom.value.roomId)
    }
  }

  const markMessagesAsRead = (messageIds = []) => {
    if (currentRoom.value) {
      socketStore.markMessagesRead(currentRoom.value.roomId, messageIds)
    }
  }

  // ======= 房間操作 =======
  const setCurrentRoom = async (room) => {
    // 離開當前房間
    if (currentRoom.value) {
      socketStore.leaveRoom(currentRoom.value.roomId)
      chatStore.clearTypingUsers()
    }

    // 設置新房間
    chatStore.setCurrentRoom(room)

    if (room) {
      // 加入新房間
      socketStore.joinRoom(room.roomId)
      socketStore.getOnlineUsers(room.roomId)

      // 載入房間訊息
      await getChatMessages(room.roomId, { page: 1, limit: 50 })
    }
  }

  const clearChatData = () => {
    if (currentRoom.value) {
      socketStore.leaveRoom(currentRoom.value.roomId)
    }
    chatStore.clearChatData()
  }

  // ======= API 操作 =======
  const getChatList = async () => {
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.getChatListAPI()
      if (res.success) {
        chatStore.setChatList(res.data.chats)
      } else {
        await Swal.fire('載入失敗', res.message || '無法載入聊天列表', 'error')
      }
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const searchUsers = async (keyword) => {
    if (!keyword?.trim()) {
      return handleApiError({ message: '請輸入搜尋關鍵字' })
    }

    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.searchUsersAPI(keyword.trim())
      if (res.success) {
        return res.data.users
      } else {
        await Swal.fire('搜尋失敗', res.message || '搜尋用戶失敗', 'error')
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const startPrivateChat = async (targetUserId) => {
    if (!targetUserId) {
      return handleApiError({ message: '請選擇聊天對象' })
    }

    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.startPrivateChatAPI(targetUserId)
      if (res.success) {
        await Swal.fire('成功', res.message || '私人聊天室創建成功', 'success')
      }
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const createGroupChat = async (groupData) => {
    if (!groupData.groupName?.trim()) {
      return handleApiError({ message: '請輸入群組名稱' })
    }
    if (!groupData.memberIds?.length) {
      return handleApiError({ message: '請至少選擇一個成員' })
    }

    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.createGroupChatAPI(groupData)
      if (res.success) {
        await Swal.fire('成功', res.message || '群組聊天室創建成功', 'success')
      }
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const getChatMessages = async (roomId, options = {}) => {
    if (!roomId) {
      return handleApiError({ message: '房間ID不能為空' })
    }

    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.getChatMessagesAPI(roomId, options)
      if (res.success) {
        if (options.page === 1) {
          chatStore.setMessages(res.data.messages)
        } else {
          chatStore.prependMessages(res.data.messages)
        }
        return { messages: res.data.messages, pagination: res.data.pagination }
      } else {
        await Swal.fire('載入失敗', res.message || '載入訊息失敗', 'error')
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const getRoomInfo = async (roomId) => {
    if (!roomId) {
      return handleApiError({ message: '房間ID不能為空' })
    }

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
      } else {
        await Swal.fire('載入失敗', res.message || '載入房間資訊失敗', 'error')
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  return {
    // Socket 狀態（響應式）
    isConnected,
    connectionState,
    connectionStatus,

    // Socket 方法
    initializeSocket,
    cleanupSocket,
    disconnectSocket,

    // 訊息操作
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,

    // 房間操作
    setCurrentRoom,
    clearChatData,

    // API 操作
    getChatList,
    searchUsers,
    startPrivateChat,
    createGroupChat,
    getChatMessages,
    getRoomInfo,

    // Chat Store 狀態
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
