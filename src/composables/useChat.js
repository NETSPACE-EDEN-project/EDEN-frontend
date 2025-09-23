// composables/useChat.js
import Swal from 'sweetalert2'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat.js'
import { useSocketStore } from '../stores/socket.js'
import { chatService } from '../services/chatService.js'

export function useChat() {
  const chatStore = useChatStore()
  const socketStore = useSocketStore()

  // Store 狀態
  const {
    chatList,
    currentRoom,
    roomInfo,
    members,
    userRole,
    messages,
    isLoading,
    error,
    hasChats,
  } = storeToRefs(chatStore)

  const { isConnected, connectionState, connectionStatus } = storeToRefs(socketStore)

  // ======= 通用錯誤處理 =======
  const handleApiError = async (err) => {
    console.error('API 呼叫失敗', err)
    const errorObj = err.response?.data || {
      success: false,
      error: 'UnknownError',
      message: err.message || '操作失敗',
    }
    chatStore.setError(errorObj)
    await Swal.fire('操作失敗', errorObj.message || '請稍後再試', 'error')
    return errorObj
  }

  // ======= Socket 初始化 & 監聽 =======
  const initializeSocket = async () => {
    console.log('>>> initializeSocket called')
    try {
      await socketStore.connect()
      console.log('>>> socket connected:', socketStore.connectionStatus.value)
      setupSocketListeners()

      const savedRoomId = sessionStorage.getItem('currentRoomId')
      if (savedRoomId) {
        console.log('>>> restoring room from sessionStorage:', savedRoomId)
        await restoreRoom(savedRoomId)
      }

      return true
    } catch (err) {
      console.error('>>> Socket 初始化失敗:', err)
      return false
    }
  }

  const setupSocketListeners = () => {
    // 清理舊監聽器
    const events = ['message_received', 'room_joined', 'auth_error']
    events.forEach((event) => socketStore.off(event))

    // 設定新監聽器
    socketStore.on('message_received', (data) => {
      if (currentRoom.value?.roomId === data.roomId) {
        chatStore.addMessage(data)
      }
      chatStore.updateLastMessage(data.roomId, data)
    })

    socketStore.on('room_joined', async (data) => {
      if (data.roomInfo) {
        updateRoomData(data.roomInfo)
      } else {
        await fetchRoomInfo(data.roomId)
      }
    })

    socketStore.on('auth_error', (data) => {
      console.error('WebSocket 認證錯誤:', data)
      Swal.fire('連接錯誤', '認證失敗，請重新登入', 'error')
    })
  }

  const cleanupSocket = () => socketStore.offAll()
  const disconnectSocket = () => {
    cleanupSocket()
    socketStore.disconnect()
  }

  // ======= 房間數據更新 =======
  const updateRoomData = (roomData) => {
    const { room, members: roomMembers, userRole: role } = roomData

    chatStore.setCurrentRoomInfo(room || roomData)
    chatStore.setMembers(roomMembers || roomData.members || [])
    chatStore.setUserRole(role || roomData.userRole || 'member')

    // 設置當前房間基本資訊
    const roomInfo = room || roomData
    chatStore.setCurrentRoom({
      roomId: roomInfo.id || roomInfo.roomId,
      roomName: roomInfo.roomName,
      roomType: roomInfo.roomType,
      memberCount: (roomMembers || roomData.members || []).length,
      isGroup: roomInfo.roomType === 'group',
    })
  }

  const fetchRoomInfo = async (roomId) => {
    try {
      const res = await chatService.getRoomInfoAPI(roomId)
      if (res.success) {
        updateRoomData(res.data)
      }
    } catch (err) {
      console.error('取得房間資訊失敗:', err)
    }
  }

  // ======= 房間操作 =======
  const restoreRoom = async (roomId) => {
    try {
      const res = await chatService.getRoomInfoAPI(roomId)
      if (res.success) {
        updateRoomData(res.data)
        socketStore.joinRoom(roomId)
        await getChatMessages(roomId, { page: 1, limit: 50 })
      }
    } catch (err) {
      console.error('恢復房間失敗:', err)
      sessionStorage.removeItem('currentRoomId')
    }
  }

  const joinRoom = async (roomId) => {
    console.log('>>> joinRoom called for roomId:', roomId)
    try {
      const res = await chatService.getRoomInfoAPI(roomId)
      console.log('>>> getRoomInfoAPI response:', res)
      if (res.success) {
        updateRoomData(res.data)
        socketStore.joinRoom(roomId)
        await getChatMessages(roomId, { page: 1, limit: 50 })
        console.log('>>> joined room successfully:', roomId)
      }
    } catch (err) {
      console.error('>>> joinRoom error:', err)
      throw err
    }
  }

  const setCurrentRoom = async (room) => {
    console.log('>>> setCurrentRoom called with room:', room)

    if (currentRoom.value) {
      console.log('>>> leaving current room:', currentRoom.value.roomId)
      socketStore.leaveRoom(currentRoom.value.roomId)
    }

    if (room) {
      console.log('>>> joining new room:', room.roomId)
      await joinRoom(room.roomId)
      sessionStorage.setItem('currentRoomId', room.roomId)
      console.log('>>> currentRoom after join:', currentRoom.value)
    } else {
      chatStore.setCurrentRoom(null)
      chatStore.clearChatData()
      sessionStorage.removeItem('currentRoomId')
      console.log('>>> cleared current room')
    }
  }

  const clearChatData = () => {
    if (currentRoom.value) {
      socketStore.leaveRoom(currentRoom.value.roomId)
    }
    chatStore.clearChatData()
    sessionStorage.removeItem('currentRoomId')
  }

  // ======= 訊息操作 =======
  const sendMessage = async (content, messageType = 'text') => {
    console.log('>>> sendMessage called with content:', content)
    if (!currentRoom.value) throw new Error('沒有選擇聊天室')
    if (!content?.trim()) throw new Error('訊息內容不能為空')

    try {
      socketStore.sendMessage(currentRoom.value.roomId, content.trim(), messageType)
      console.log('>>> message sent via socket to roomId:', currentRoom.value.roomId)
      return { success: true }
    } catch (err) {
      console.error('>>> sendMessage error:', err)
      return { success: false, error: await handleApiError(err) }
    }
  }

  const addMessage = (message) => {
    chatStore.addMessage(message)
  }

  // ======= API 操作 =======
  const getChatList = async () => {
    chatStore.setLoading(true)
    chatStore.clearError()
    try {
      const res = await chatService.getChatListAPI()
      if (res.success) {
        chatStore.setChatList(res.data.chatrooms)
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
      if (!res.success) {
        await Swal.fire('搜尋失敗', res.message || '搜尋用戶失敗', 'error')
      }
      return res
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
        // 自動跳轉到新創建的聊天室
        if (res.data.roomId) {
          await setCurrentRoom({
            roomId: res.data.roomId,
            roomName: res.data.roomName,
            roomType: 'private',
            isGroup: false,
          })
        }
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
        // 自動跳轉到新創建的群組
        if (res.data.roomId) {
          await setCurrentRoom({
            roomId: res.data.roomId,
            roomName: res.data.roomName,
            roomType: 'group',
            isGroup: true,
          })
        }
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
        return {
          messages: res.data.messages,
          pagination: res.data.pagination,
        }
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
        updateRoomData(res.data)
      } else {
        await Swal.fire('載入失敗', res.message || '載入房間資訊失敗', 'error')
      }
      return res
    } catch (err) {
      return handleApiError(err)
    } finally {
      chatStore.setLoading(false)
    }
  }

  return {
    // Socket 狀態
    isConnected,
    connectionState,
    connectionStatus,

    // Socket 方法
    initializeSocket,
    cleanupSocket,
    disconnectSocket,

    // 房間操作
    setCurrentRoom,
    clearChatData,
    joinRoom,
    fetchRoomInfo,

    // 訊息操作
    sendMessage,
    addMessage,

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
    isLoading,
    error,
    hasChats,
  }
}
