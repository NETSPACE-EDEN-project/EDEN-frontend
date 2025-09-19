import Swal from 'sweetalert2'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat.js'
import { chatService } from '../services/chatService.js'
import * as websocketService from '../services/websocketService.js'

export function useChat() {
  const chatStore = useChatStore()

  const {
    chatList,
    currentRoom,
    currentRoomInfo,
    messages,
    onlineUsers,
    typingUsers,
    isLoading,
    error,
    hasChats,
  } = storeToRefs(chatStore)

  const handleApiError = async (error) => {
    console.error('聊天 API 呼叫失敗', error)
    const errorObj = error.response?.data || {
      success: false,
      error: 'UnknownError',
      message: error.message || '操作失敗',
    }

    chatStore.setError(errorObj)
    await Swal.fire('操作失敗', errorObj.message || '請稍後再試', 'error')

    return errorObj
  }

  // ========== WebSocket ==========
  const initializeWebSocket = async () => {
    try {
      await websocketService.connect()
      console.log('WebSocket 連接成功')

      setupWebSocketListeners()

      return true
    } catch (error) {
      console.error('WebSocket 連接失敗:', error)
      return false
    }
  }

  const wsHandlers = {}

  //設置 WebSocket 事件監聽器
  const setupWebSocketListeners = () => {
    const events = [
      'message_received',
      'room_joined',
      'user_joined',
      'user_left',
      'user_typing',
      'user_stop_typing',
      'online_users_updated',
      'connection_established',
      'connection_lost',
      'auth_error',
    ]

    events.forEach((event) => {
      const handler = (data) => {
        switch (event) {
          case 'message_received':
            console.log('收到新消息:', data)
            if (currentRoom.value && data.roomId === currentRoom.value.roomId) {
              chatStore.addMessage(data)
            }
            chatStore.updateLastMessage(data.roomId, data)
            break
          case 'room_joined':
            console.log('成功加入房間:', data)
            if (data.messages) chatStore.setMessages(data.messages)
            if (data.onlineUsers) chatStore.setOnlineUsers(data.onlineUsers)
            break
          case 'user_joined':
            console.log('用戶加入房間:', data)
            if (currentRoom.value && data.roomId === currentRoom.value.roomId) {
              console.log(`用戶 ${data.username} 加入了房間`)
            }
            break
          case 'user_left':
            console.log('用戶離開房間:', data)
            if (currentRoom.value && data.roomId === currentRoom.value.roomId) {
              console.log(`用戶 ${data.username} 離開了房間`)
            }
            break
          case 'user_typing':
            if (currentRoom.value && data.roomId === currentRoom.value.roomId) {
              chatStore.addTypingUser({ userId: data.userId, username: data.username })
            }
            break
          case 'user_stop_typing':
            if (currentRoom.value && data.roomId === currentRoom.value.roomId) {
              chatStore.removeTypingUser(data.userId)
            }
            break
          case 'online_users_updated':
            if (currentRoom.value && data.roomId === currentRoom.value.roomId) {
              chatStore.setOnlineUsers(data.users || [])
            }
            break
          case 'connection_established':
            console.log('WebSocket 連接已建立')
            break
          case 'connection_lost':
            console.log('WebSocket 連線丟失:', data)
            break
          case 'auth_error':
            console.error('WebSocket 認證錯誤:', data)
            Swal.fire('連接錯誤', '認證失敗，請重新登入', 'error')
            break
        }
      }

      // 存到 wsHandlers
      wsHandlers[event] = handler

      // 註冊事件
      websocketService.on(event, handler)
    })
  }

  // 清理 WebSocket 監聽器
  const cleanupWebSocketListeners = () => {
    Object.entries(wsHandlers).forEach(([event, handler]) => {
      websocketService.off(event, handler)
    })
  }

  // 斷開 WebSocket 連接
  const disconnectWebSocket = () => {
    cleanupWebSocketListeners()
    websocketService.disconnect()
  }

  // ========== 消息相關方法 ==========
  // 發送消息（通過 WebSocket）
  const sendMessage = async (content, messageType = 'text', replyToId = null) => {
    if (!currentRoom.value) {
      throw new Error('沒有選擇聊天室')
    }

    if (!content?.trim()) {
      throw new Error('消息內容不能為空')
    }

    try {
      websocketService.sendMessage(currentRoom.value.roomId, content.trim(), messageType, replyToId)

      return { success: true }
    } catch (error) {
      console.error('發送消息失敗:', error)
      await handleApiError(error)
      return { success: false, error }
    }
  }

  // 開始輸入
  const startTyping = () => {
    if (currentRoom.value) {
      websocketService.startTyping(currentRoom.value.roomId)
    }
  }

  // 停止輸入
  const stopTyping = () => {
    if (currentRoom.value) {
      websocketService.stopTyping(currentRoom.value.roomId)
    }
  }

  // ========== 房間相關方法 ==========

  // 設置當前房間並加入
  const setCurrentRoom = async (room) => {
    if (currentRoom.value) {
      websocketService.leaveRoom(currentRoom.value.roomId)
      chatStore.clearTypingUsers()
    }

    chatStore.setCurrentRoom(room)

    if (room) {
      try {
        websocketService.joinRoom(room.roomId)
        websocketService.getOnlineUsers(room.roomId)
      } catch (error) {
        console.error('加入房間失敗:', error)
      }
    }
  }

  // 標記消息為已讀
  const markMessagesAsRead = (messageIds = []) => {
    if (currentRoom.value) {
      websocketService.markMessagesRead(currentRoom.value.roomId, messageIds)
    }
  }

  const getChatList = async () => {
    chatStore.setLoading(true)
    chatStore.clearError()

    try {
      const res = await chatService.getChatListAPI()

      if (res.success) {
        chatStore.setChatList(res.data.chats)
        return res
      } else {
        chatStore.setError(res)
        await Swal.fire('載入失敗', res.message || '無法載入聊天列表', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const searchUsers = async (keyword) => {
    if (!keyword?.trim()) {
      const errObj = { success: false, error: 'MissingKeyword', message: '請輸入搜尋關鍵字' }
      await Swal.fire('錯誤', errObj.message, 'error')
      chatStore.setError(errObj)
      return errObj
    }

    chatStore.setLoading(true)
    chatStore.clearError()

    try {
      const res = await chatService.searchUsersAPI(keyword.trim())

      if (res.success) {
        return res
      } else {
        chatStore.setError(res)
        await Swal.fire('搜尋失敗', res.message || '搜尋用戶失敗', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const startPrivateChat = async (targetUserId) => {
    if (!targetUserId) {
      const errObj = { success: false, error: 'MissingUserId', message: '請選擇聊天對象' }
      await Swal.fire('錯誤', errObj.message, 'error')
      chatStore.setError(errObj)
      return errObj
    }

    chatStore.setLoading(true)
    chatStore.clearError()

    try {
      const res = await chatService.startPrivateChatAPI(targetUserId)

      if (res.success) {
        await Swal.fire('成功', '私人聊天室創建成功', 'success')
        return res
      } else {
        chatStore.setError(res)
        await Swal.fire('創建失敗', res.message || '創建私人聊天失敗', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const createGroupChat = async (groupData) => {
    if (!groupData.groupName?.trim()) {
      const errObj = { success: false, error: 'MissingGroupName', message: '請輸入群組名稱' }
      await Swal.fire('錯誤', errObj.message, 'error')
      chatStore.setError(errObj)
      return errObj
    }

    if (!groupData.memberIds || groupData.memberIds.length === 0) {
      const errObj = { success: false, error: 'MissingMembers', message: '請至少選擇一個成員' }
      await Swal.fire('錯誤', errObj.message, 'error')
      chatStore.setError(errObj)
      return errObj
    }

    chatStore.setLoading(true)
    chatStore.clearError()

    try {
      const res = await chatService.createGroupChatAPI(groupData)

      if (res.success) {
        await Swal.fire('成功', '群組聊天創建成功', 'success')
        return res
      } else {
        chatStore.setError(res)
        await Swal.fire('創建失敗', res.message || '創建群組聊天失敗', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const getChatMessages = async (roomId, options = {}) => {
    if (!roomId) {
      const errObj = { success: false, error: 'MissingRoomId', message: '房間ID不能為空' }
      chatStore.setError(errObj)
      return errObj
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
        return res
      } else {
        chatStore.setError(res)
        await Swal.fire('載入失敗', res.message || '載入訊息失敗', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const getRoomInfo = async (roomId) => {
    if (!roomId) {
      const errObj = { success: false, error: 'MissingRoomId', message: '房間ID不能為空' }
      chatStore.setError(errObj)
      return errObj
    }

    chatStore.setLoading(true)
    chatStore.clearError()

    try {
      const res = await chatService.getRoomInfoAPI(roomId)

      if (res.success) {
        if (chatStore.setCurrentRoomInfo) {
          chatStore.setCurrentRoomInfo(res.data)
        }
        return res
      } else {
        chatStore.setError(res)
        await Swal.fire('載入失敗', res.message || '載入房間資訊失敗', 'error')
        return res
      }
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  const clearChatData = () => {
    if (currentRoom.value) {
      websocketService.leaveRoom(currentRoom.value.roomId)
    }

    chatStore.clearChatData()
  }

  return {
    initializeWebSocket,
    disconnectWebSocket,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,

    getChatList,
    searchUsers,
    startPrivateChat,
    createGroupChat,
    getChatMessages,
    getRoomInfo,

    chatList,
    currentRoom,
    currentRoomInfo,
    messages,
    onlineUsers,
    typingUsers,
    isLoading,
    error,
    hasChats,

    setCurrentRoom,
    addMessage: chatStore.addMessage,
    addTypingUser: chatStore.addTypingUser,
    removeTypingUser: chatStore.removeTypingUser,
    clearChatData,
    updateLastMessage: chatStore.updateLastMessage,
  }
}
