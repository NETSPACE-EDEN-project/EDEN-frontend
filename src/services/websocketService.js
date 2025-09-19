import { io } from 'socket.io-client'

// ========== 全域狀態 ==========
let socket = null
let isConnected = false
let reconnectAttempts = 0
let reconnectInterval = null
let eventListeners = new Map()

const config = {
  url: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
  maxReconnectAttempts: 5,
  options: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true,
    autoConnect: false,
    withCredentials: true,
  },
}

// ========== 事件訂閱/取消訂閱 ==========
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

// ========== 重連機制 ==========
const handleReconnection = () => {
  if (reconnectAttempts >= config.maxReconnectAttempts) {
    console.error('重連次數已達上限')
    emit('max_reconnect_attempts_reached')
    return
  }

  if (reconnectInterval) {
    clearTimeout(reconnectInterval)
  }
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
  reconnectAttempts++
  console.log(`將在 ${delay}ms 後嘗試第 ${reconnectAttempts} 次重連`)

  reconnectInterval = setTimeout(() => {
    if (!isConnected && socket) {
      console.log(`正在嘗試第 ${reconnectAttempts} 次重連...`)
      socket.connect()
    }
  }, delay)
}

// ========== 設定 Socket 事件監聽 ==========
const setupEventListeners = () => {
  if (!socket) return

  socket.on('connect', () => {
    console.log('WebSocket 已連接，Socket ID:', socket.id)
    isConnected = true
    reconnectAttempts = 0
    emit('connection_established')
  })

  socket.on('disconnect', (reason) => {
    console.log('WebSocket 已斷線，原因:', reason)
    isConnected = false
    emit('connection_lost', reason)
    if (reason !== 'io client disconnect') {
      handleReconnection()
    }
  })

  socket.on('connect_error', (error) => {
    console.error('WebSocket 連接錯誤:', error.message)
    isConnected = false
    emit('connection_error', error)
    handleReconnection()
  })

  socket.on('error', (error) => {
    console.error('WebSocket 錯誤:', error)
    emit('auth_error', error)
  })

  // 事件轉發
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
    socket.on(event, (response) => {
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

// ========== 連線 ==========
const connect = async () => {
  if (isConnected && socket) {
    return true
  }

  console.log('正在建立 WebSocket 連接...')

  socket = io(config.url, { ...config.options })
  setupEventListeners()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('連接超時')), config.options.timeout)

    socket.once('connect', () => {
      clearTimeout(timeout)
      isConnected = true
      reconnectAttempts = 0
      console.log('WebSocket 連接成功')
      resolve(true)
    })

    socket.once('connect_error', (error) => {
      clearTimeout(timeout)
      console.error('WebSocket 連接失敗:', error.message)
      reject(error)
    })
  })
}

// ========== 發送事件 ==========
const sendMessage = (roomId, content, messageType = 'text', replyToId = null) => {
  if (!isConnected || !socket) throw new Error('WebSocket 未連接')
  socket.emit('send_message', { roomId, content, messageType, replyToId })
}

const joinRoom = (roomId) => {
  if (!isConnected || !socket) throw new Error('WebSocket 未連接')
  socket.emit('join_room', { roomId })
}
const leaveRoom = (roomId) => {
  if (!isConnected || !socket) throw new Error('WebSocket 未連接')
  socket.emit('leave_room', { roomId })
}
const startTyping = (roomId) => {
  if (!isConnected || !socket) return
  socket.emit('typing_start', { roomId })
}
const stopTyping = (roomId) => {
  if (!isConnected || !socket) return
  socket.emit('typing_stop', { roomId })
}
const getOnlineUsers = (roomId = null) => {
  if (!isConnected || !socket) return
  socket.emit('get_online_users', roomId ? { roomId } : {})
}
const markMessagesRead = (roomId, messageIds = []) => {
  if (!isConnected || !socket) return
  socket.emit('mark_messages_read', { roomId, messageIds })
}

// ========== 斷線 ==========
const disconnect = () => {
  if (reconnectInterval) {
    clearTimeout(reconnectInterval)
    reconnectInterval = null
  }
  if (socket) {
    socket.disconnect()
    socket = null
  }
  isConnected = false
  reconnectAttempts = 0
  eventListeners.clear()
  console.log('WebSocket 連接已手動斷開')
}

// ========== 連線狀態 ==========
const getConnectionState = () => ({
  isConnected,
  socketId: socket?.id,
  reconnectAttempts,
})

export {
  connect,
  disconnect,
  sendMessage,
  joinRoom,
  leaveRoom,
  startTyping,
  stopTyping,
  getOnlineUsers,
  markMessagesRead,
  getConnectionState,
  on,
  off,
  emit,
}
