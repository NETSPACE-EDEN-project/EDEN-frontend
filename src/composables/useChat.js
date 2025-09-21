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

  // ======= WebSocket 管理 =======
  const wsHandlers = {}

  const initializeWebSocket = async () => {
    try {
      const result = await websocketService.connect()
      if (result) {
        setupWebSocketListeners()
        return true
      } else return false
    } catch (err) {
      console.error('WebSocket 連接失敗:', err)
      return false
    }
  }

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
      const handler = async (data) => {
        switch (event) {
          case 'message_received':
            if (currentRoom.value?.roomId === data.roomId) chatStore.addMessage(data)
            chatStore.updateLastMessage(data.roomId, data)
            break

          case 'room_joined':
            console.log('成功加入房間:', data)

            // 如果有訊息就更新 messages
            if (data.messages) chatStore.setMessages(data.messages)

            // 更新線上用戶
            if (data.onlineUsers) chatStore.setOnlineUsers(data.onlineUsers)

            // 同步房間資訊
            if (data.roomInfo) {
              chatStore.setCurrentRoomInfo({
                ...data.roomInfo,
                members: data.roomInfo.members || [],
                userRole: data.roomInfo.userRole || 'member',
              })
            } else {
              // 若沒有 roomInfo，透過 API 抓一次
              const res = await chatService.getRoomInfoAPI(data.roomId)
              if (res.success)
                chatStore.setCurrentRoomInfo({
                  ...res.data.room,
                  members: res.data.members,
                  userRole: res.data.userRole,
                })
            }

            break

          case 'user_joined':
            if (currentRoom.value?.roomId === data.roomId) {
              console.log(`用戶 ${data.username} 加入了房間`)
              chatStore.setOnlineUsers([...onlineUsers.value, data])
            }
            break

          case 'user_left':
            if (currentRoom.value?.roomId === data.roomId) {
              console.log(`用戶 ${data.username} 離開了房間`)
              chatStore.setOnlineUsers(onlineUsers.value.filter((u) => u.userId !== data.userId))
            }
            break

          case 'user_typing':
            if (currentRoom.value?.roomId === data.roomId) chatStore.addTypingUser(data)
            break

          case 'user_stop_typing':
            if (currentRoom.value?.roomId === data.roomId) chatStore.removeTypingUser(data.userId)
            break

          case 'online_users_updated':
            if (currentRoom.value?.roomId === data.roomId)
              chatStore.setOnlineUsers(data.users || [])
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

      wsHandlers[event] = handler
      websocketService.on(event, handler)
    })
  }

  const cleanupWebSocketListeners = () => {
    Object.entries(wsHandlers).forEach(([event, handler]) => websocketService.off(event, handler))
  }

  const disconnectWebSocket = () => {
    cleanupWebSocketListeners()
    websocketService.disconnect()
  }

  // ======= 消息操作 =======
  const sendMessage = async (content, messageType = 'text', replyToId = null) => {
    if (!currentRoom.value) throw new Error('沒有選擇聊天室')
    if (!content?.trim()) throw new Error('消息內容不能為空')
    try {
      websocketService.sendMessage(currentRoom.value.roomId, content.trim(), messageType, replyToId)
      return { success: true }
    } catch (err) {
      return { success: false, error: await handleApiError(err) }
    }
  }

  const startTyping = () =>
    currentRoom.value && websocketService.startTyping(currentRoom.value.roomId)
  const stopTyping = () =>
    currentRoom.value && websocketService.stopTyping(currentRoom.value.roomId)
  const markMessagesAsRead = (messageIds = []) =>
    currentRoom.value && websocketService.markMessagesRead(currentRoom.value.roomId, messageIds)

  // ======= 房間管理 =======
  const setCurrentRoom = async (room) => {
    if (currentRoom.value) {
      websocketService.leaveRoom(currentRoom.value.roomId)
      chatStore.clearTypingUsers()
    }
    chatStore.setCurrentRoom(room)
    if (room) {
      websocketService.joinRoom(room.roomId)
      websocketService.getOnlineUsers(room.roomId)
    }
  }

  const clearChatData = () => {
    if (currentRoom.value) websocketService.leaveRoom(currentRoom.value.roomId)
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
    // WebSocket
    initializeWebSocket,
    disconnectWebSocket,
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
    // store 方法
    addMessage: chatStore.addMessage,
    addTypingUser: chatStore.addTypingUser,
    removeTypingUser: chatStore.removeTypingUser,
    updateLastMessage: chatStore.updateLastMessage,
  }
}
