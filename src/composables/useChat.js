import Swal from 'sweetalert2'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chat.js'
import { chatService } from '../services/chatService.js'

export function useChat() {
  const chatStore = useChatStore()

  const {
    chatList,
    currentRoom,
    currentRoomInfo,
    onlineUsers,
    typingUsers,
    messages,
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
        if (res.data.isNew) {
          await Swal.fire('成功', '私人聊天室創建成功', 'success')
        } else {
          await Swal.fire('提示', '聊天室已存在', 'info')
        }
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

  return {
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

    setCurrentRoom: chatStore.setCurrentRoom,
    addMessage: chatStore.addMessage,
    addTypingUser: chatStore.addTypingUser,
    removeTypingUser: chatStore.removeTypingUser,
    clearChatData: chatStore.clearChatData,
    updateLastMessage: chatStore.updateLastMessage,
  }
}
