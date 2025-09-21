import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore('socket', () => {
  // ===== state =====
  const socket = ref(null)
  const isConnected = ref(false)
  const connectionState = ref('disconnected') // 'disconnected', 'connecting', 'connected'
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const currentRoomId = ref(null)
  const eventListeners = reactive(new Map())

  // ===== getters =====
  const canSendMessage = computed(() => isConnected.value && socket.value)
  const connectionStatus = computed(() => ({
    isConnected: isConnected.value,
    state: connectionState.value,
    attempts: reconnectAttempts.value,
    socketId: socket.value?.id,
  }))

  // ===== actions =====
  const connect = async (
    url = import.meta.env.VITE_WS_URL || 'http://localhost:3000',
    options = {},
  ) => {
    if (socket.value && isConnected.value) return true

    const authToken = document.cookie.includes('auth_token')
    if (!authToken) {
      console.warn('尚未登入，不建立 WebSocket 連線')
      return false
    }

    connectionState.value = 'connecting'

    try {
      socket.value = io(url, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        timeout: 20000,
        forceNew: true,
        ...options,
      })

      setupEventListeners()
      socket.value.connect()

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          connectionState.value = 'disconnected'
          reject(new Error('連線超時'))
        }, 20000)

        socket.value.once('connect', () => {
          clearTimeout(timeout)
          isConnected.value = true
          connectionState.value = 'connected'
          reconnectAttempts.value = 0

          if (currentRoomId.value) {
            joinRoom(currentRoomId.value)
          }

          resolve(true)
        })

        socket.value.once('connect_error', (error) => {
          clearTimeout(timeout)
          connectionState.value = 'disconnected'
          reject(error)
        })
      })
    } catch (error) {
      connectionState.value = 'disconnected'
      throw error
    }
  }

  const setupEventListeners = () => {
    if (!socket.value) return

    socket.value.on('connect', () => {
      console.log('Socket connected:', socket.value.id)
      isConnected.value = true
      connectionState.value = 'connected'
      reconnectAttempts.value = 0
      emit('connection_established')
    })

    socket.value.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      isConnected.value = false
      connectionState.value = 'disconnected'
      emit('connection_lost', reason)

      if (reason !== 'io client disconnect') {
        handleReconnection()
      }
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      isConnected.value = false
      connectionState.value = 'disconnected'
      emit('connection_error', error)
      handleReconnection()
    })

    socket.value.on('error', (error) => {
      console.error('Socket error:', error)
      emit('auth_error', error)
    })

    // Socket 事件轉發
    const events = [
      'new_message',
      'user_joined_room',
      'user_left_room',
      'user_online',
      'user_offline',
      'user_typing',
      'user_stop_typing',
      'joined_room',
      'left_room',
      'online_users',
      'messages_marked_read',
      'notification',
    ]

    events.forEach((event) => {
      socket.value.on(event, (response) => {
        if (response.success) {
          const mapEvent =
            {
              new_message: 'message_received',
              user_joined_room: 'user_joined',
              user_left_room: 'user_left',
              joined_room: 'room_joined',
              left_room: 'room_left',
              online_users: 'online_users_updated',
              messages_marked_read: 'messages_read',
            }[event] || event

          emit(mapEvent, response.data)
        }
      })
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    isConnected.value = false
    connectionState.value = 'disconnected'
    reconnectAttempts.value = 0
    currentRoomId.value = null
    eventListeners.clear()
    sessionStorage.removeItem('currentRoomId')
  }

  const handleReconnection = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error('達到最大重連次數')
      emit('max_reconnect_attempts_reached')
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)

    console.log(`將在 ${delay}ms 後嘗試第 ${reconnectAttempts.value} 次重連`)

    setTimeout(() => {
      if (!isConnected.value && socket.value) {
        connectionState.value = 'connecting'
        socket.value.connect()
      }
    }, delay)
  }

  const joinRoom = (roomId) => {
    if (!canSendMessage.value) throw new Error('Socket 未連線')
    socket.value.emit('join_room', { roomId })
    currentRoomId.value = roomId
    sessionStorage.setItem('currentRoomId', roomId)
  }

  const leaveRoom = (roomId) => {
    if (!canSendMessage.value) return
    socket.value.emit('leave_room', { roomId })

    if (currentRoomId.value === roomId) {
      currentRoomId.value = null
      sessionStorage.removeItem('currentRoomId')
    }
  }

  const sendMessage = (roomId, content, messageType = 'text', replyToId = null) => {
    if (!canSendMessage.value) throw new Error('Socket 未連線')
    socket.value.emit('send_message', { roomId, content, messageType, replyToId })
  }

  const startTyping = (roomId) => {
    if (!canSendMessage.value) return
    socket.value.emit('typing_start', { roomId })
  }

  const stopTyping = (roomId) => {
    if (!canSendMessage.value) return
    socket.value.emit('typing_stop', { roomId })
  }

  const getOnlineUsers = (roomId = null) => {
    if (!canSendMessage.value) return
    socket.value.emit('get_online_users', roomId ? { roomId } : {})
  }

  const markMessagesRead = (roomId, messageIds = []) => {
    if (!canSendMessage.value) return
    socket.value.emit('mark_messages_read', { roomId, messageIds })
  }

  const on = (event, callback) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event).add(callback)
  }

  const off = (event, callback) => {
    if (eventListeners.has(event)) {
      eventListeners.get(event).delete(callback)
    }
  }

  const offAll = () => {
    eventListeners.clear()
  }

  const emit = (event, data) => {
    if (eventListeners.has(event)) {
      eventListeners.get(event).forEach((callback) => {
        try {
          callback(data)
        } catch (err) {
          console.error(`事件處理器錯誤 (${event}):`, err)
        }
      })
    }
  }

  // ===== return =====
  return {
    socket,
    isConnected,
    connectionState,
    reconnectAttempts,
    maxReconnectAttempts,
    currentRoomId,
    eventListeners,

    canSendMessage,
    connectionStatus,

    connect,
    setupEventListeners,
    disconnect,
    handleReconnection,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    getOnlineUsers,
    markMessagesRead,
    on,
    off,
    offAll,
    emit,
  }
})
