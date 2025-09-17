import { io } from 'socket.io-client'

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
      } catch (error) {
        console.error(`事件處理器執行錯誤 (${event}):`, error)
      }
    })
  }
}

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

const setupEventListeners = () => {
  if (!socket) return

  // 連接事件
  socket.on('connect', () => {
    console.log('WebSocket 已連接，Socket ID:', socket.id)
    isConnected = true
    reconnectAttempts = 0
    emit('connection_established')
  })

  // 斷線事件
  socket.on('disconnect', (reason) => {
    console.log('WebSocket 已斷線，原因:', reason)
    isConnected = false
    emit('connection_lost', reason)

    if (reason !== 'io client disconnect') {
      handleReconnection()
    }
  })

  // 連接錯誤
  socket.on('connect_error', (error) => {
    console.error('WebSocket 連接錯誤:', error.message)
    isConnected = false
    emit('connection_error', error)
    handleReconnection()
  })

  // 認證錯誤
  socket.on('error', (error) => {
    console.error('WebSocket 錯誤:', error)
    emit('auth_error', error)
  })

  // 新消息
  socket.on('new_message', (response) => {
    if (response.success) {
      emit('message_received', response.data)
    }
  })

  // 用戶加入房間
  socket.on('user_joined_room', (response) => {
    if (response.success) {
      emit('user_joined', response.data)
    }
  })

  // 用戶離開房間
  socket.on('user_left_room', (response) => {
    if (response.success) {
      emit('user_left', response.data)
    }
  })

  // 用戶上線
  socket.on('user_online', (response) => {
    if (response.success) {
      emit('user_online', response.data)
    }
  })

  // 用戶離線
  socket.on('user_offline', (response) => {
    if (response.success) {
      emit('user_offline', response.data)
    }
  })

  // 正在輸入
  socket.on('user_typing', (response) => {
    if (response.success) {
      emit('user_typing', response.data)
    }
  })

  // 停止輸入
  socket.on('user_stop_typing', (response) => {
    if (response.success) {
      emit('user_stop_typing', response.data)
    }
  })

  // 成功加入房間
  socket.on('joined_room', (response) => {
    if (response.success) {
      emit('room_joined', response.data)
    }
  })

  // 成功離開房間
  socket.on('left_room', (response) => {
    if (response.success) {
      emit('room_left', response.data)
    }
  })

  // 線上用戶列表
  socket.on('online_users', (response) => {
    if (response.success) {
      emit('online_users_updated', response.data)
    }
  })

  // 消息已讀確認
  socket.on('messages_marked_read', (response) => {
    if (response.success) {
      emit('messages_read', response.data)
    }
  })

  // 通知
  socket.on('notification', (response) => {
    if (response.success) {
      emit('notification', response.data)
    }
  })
}

const getAuthToken = () => {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }

  return getCookie('auth_token')
}

const connect = async () => {
  if (isConnected && socket) {
    console.log('WebSocket 已經連接')
    return true
  }

  try {
    console.log('正在建立 WebSocket 連接...')

    // 從 cookie 獲取認證 token
    const token = getAuthToken()

    if (!token) {
      throw new Error('未找到認證 token')
    }

    socket = io(config.url, {
      ...config.options,
      auth: { token },
      query: { token },
      withCredentials: true,
    })

    setupEventListeners()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('連接超時'))
      }, config.options.timeout)

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
  } catch (error) {
    console.error('建立 WebSocket 連接時發生錯誤:', error)
    throw error
  }
}

const sendMessage = (roomId, content, messageType = 'text', replyToId = null) => {
  if (!isConnected || !socket) {
    throw new Error('WebSocket 未連接')
  }

  socket.emit('send_message', {
    roomId,
    content,
    messageType,
    replyToId,
  })
}

const joinRoom = (roomId) => {
  if (!isConnected || !socket) {
    throw new Error('WebSocket 未連接')
  }

  socket.emit('join_room', { roomId })
}

const leaveRoom = (roomId) => {
  if (!isConnected || !socket) {
    throw new Error('WebSocket 未連接')
  }

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
