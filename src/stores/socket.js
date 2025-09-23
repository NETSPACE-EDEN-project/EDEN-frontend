import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = ref(false)
  const connectionState = ref('disconnected')
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const currentRoomId = ref(null)
  const eventListeners = new Map() // 移除 reactive，因為不需要響應式

  const canSendMessage = computed(() => isConnected.value && socket.value)

  const connectionStatus = computed(() => ({
    isConnected: isConnected.value,
    state: connectionState.value,
    attempts: reconnectAttempts.value,
    socketId: socket.value?.id || '',
  }))

  // ====== Socket connect ======
  const connect = async (
    url = import.meta.env.VITE_WS_URL || 'http://localhost:3000',
    options = {},
  ) => {
    if (socket.value && isConnected.value) return true

    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
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

          if (currentRoomId.value) joinRoom(currentRoomId.value)

          resolve(true)
        })

        socket.value.once('connect_error', (error) => {
          clearTimeout(timeout)
          connectionState.value = 'disconnected'
          console.error('Socket connect_error:', error)
          Swal.fire('連線失敗', '無法連接伺服器，請稍後再試', 'error')
          reject(error)
        })
      })
    } catch (error) {
      connectionState.value = 'disconnected'
      throw error
    }
  }

  // ====== 統一事件轉發 ======
  const emitEvent = (event, data) => {
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

  let isListenersSetup = false

  const setupEventListeners = () => {
    if (isListenersSetup) return
    isListenersSetup = true
    if (!socket.value) return

    socket.value.on('connect', () => {
      console.log('Socket connected:', socket.value.id)
      isConnected.value = true
      connectionState.value = 'connected'
      reconnectAttempts.value = 0
      emitEvent('connection_established')
    })

    socket.value.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason)
      isConnected.value = false
      connectionState.value = 'disconnected'
      emitEvent('connection_lost', reason)

      if (reason !== 'io client disconnect') handleReconnection()
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connect_error:', error)
      isConnected.value = false
      connectionState.value = 'disconnected'
      emitEvent('connection_error', error)
      handleReconnection()
    })

    socket.value.on('error', (error) => {
      console.error('Socket error:', error)
      emitEvent('auth_error', error)
      // 認證錯誤的 Swal 提示
      Swal.fire('認證錯誤', '請重新登入', 'error')
    })

    // 簡化的事件監聽 - 只保留基本功能
    const socketEvents = ['new_message', 'joined_room', 'left_room', 'notification']

    socketEvents.forEach((event) => {
      socket.value.on(event, (response) => {
        if (response.success) {
          const mapEvent =
            {
              new_message: 'message_received',
              joined_room: 'room_joined',
              left_room: 'room_left',
            }[event] || event

          emitEvent(mapEvent, response.data)
        }
      })
    })
  }

  // ====== 連線管理 ======
  const disconnect = () => {
    if (socket.value) socket.value.disconnect()
    socket.value = null
    isConnected.value = false
    connectionState.value = 'disconnected'
    reconnectAttempts.value = 0
    currentRoomId.value = null
    eventListeners.clear()
    sessionStorage.removeItem('currentRoomId')
    isListenersSetup = false
  }

  const handleReconnection = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error('達到最大重連次數')
      emitEvent('max_reconnect_attempts_reached')
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

  // ====== 房間管理 ======
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

  // ====== 訊息發送 ======
  const sendMessage = (roomId, content, messageType = 'text') => {
    if (!canSendMessage.value) throw new Error('Socket 未連線')
    socket.value.emit('send_message', { roomId, content, messageType })
  }

  // ====== 事件監聽 API ======
  const on = (event, callback) => {
    if (!eventListeners.has(event)) eventListeners.set(event, new Set())
    eventListeners.get(event).add(callback)
  }

  const off = (event, callback) => {
    if (eventListeners.has(event)) eventListeners.get(event).delete(callback)
  }

  const offAll = () => eventListeners.clear()

  return {
    // 狀態
    socket,
    isConnected,
    connectionState,
    reconnectAttempts,
    maxReconnectAttempts,
    currentRoomId,

    // 計算屬性
    canSendMessage,
    connectionStatus,

    // 連線管理
    connect,
    disconnect,
    handleReconnection,

    // 房間管理
    joinRoom,
    leaveRoom,

    // 訊息發送
    sendMessage,

    // 事件監聽
    on,
    off,
    offAll,
    emit: emitEvent,

    // 內部方法（如果需要的話）
    setupEventListeners,
  }
})
