import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    isConnected: false,
    connectionState: 'disconnected', // 'disconnected', 'connecting', 'connected'
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    currentRoomId: null,
    eventListeners: new Map(),
  }),

  getters: {
    canSendMessage: (state) => state.isConnected && state.socket,
    connectionStatus: (state) => ({
      isConnected: state.isConnected,
      state: state.connectionState,
      attempts: state.reconnectAttempts,
      socketId: state.socket?.id,
    }),
  },

  actions: {
    async connect(url = import.meta.env.VITE_WS_URL || 'http://localhost:3000', options = {}) {
      if (this.socket && this.isConnected) return true

      this.connectionState = 'connecting'

      try {
        this.socket = io(url, {
          autoConnect: false,
          transports: ['websocket', 'polling'],
          withCredentials: true,
          timeout: 20000,
          forceNew: true,
          ...options,
        })

        this.setupEventListeners()
        this.socket.connect()

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.connectionState = 'disconnected'
            reject(new Error('連線超時'))
          }, 20000)

          this.socket.once('connect', () => {
            clearTimeout(timeout)
            this.isConnected = true
            this.connectionState = 'connected'
            this.reconnectAttempts = 0

            // 自動重新加入房間
            if (this.currentRoomId) {
              this.joinRoom(this.currentRoomId)
            }

            resolve(true)
          })

          this.socket.once('connect_error', (error) => {
            clearTimeout(timeout)
            this.connectionState = 'disconnected'
            reject(error)
          })
        })
      } catch (error) {
        this.connectionState = 'disconnected'
        throw error
      }
    },

    setupEventListeners() {
      if (!this.socket) return

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id)
        this.isConnected = true
        this.connectionState = 'connected'
        this.reconnectAttempts = 0
        this.emit('connection_established')
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        this.isConnected = false
        this.connectionState = 'disconnected'
        this.emit('connection_lost', reason)

        if (reason !== 'io client disconnect') {
          this.handleReconnection()
        }
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        this.isConnected = false
        this.connectionState = 'disconnected'
        this.emit('connection_error', error)
        this.handleReconnection()
      })

      this.socket.on('error', (error) => {
        console.error('Socket error:', error)
        this.emit('auth_error', error)
      })

      // 設置 Socket.IO 事件轉發
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
        this.socket.on(event, (response) => {
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

            this.emit(mapEvent, response.data)
          }
        })
      })
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      this.isConnected = false
      this.connectionState = 'disconnected'
      this.reconnectAttempts = 0
      this.currentRoomId = null
      this.eventListeners.clear()
      sessionStorage.removeItem('currentRoomId')
    },

    handleReconnection() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('達到最大重連次數')
        this.emit('max_reconnect_attempts_reached')
        return
      }

      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

      console.log(`將在 ${delay}ms 後嘗試第 ${this.reconnectAttempts} 次重連`)

      setTimeout(() => {
        if (!this.isConnected && this.socket) {
          this.connectionState = 'connecting'
          this.socket.connect()
        }
      }, delay)
    },

    // Socket 事件發送
    joinRoom(roomId) {
      if (!this.canSendMessage) throw new Error('Socket 未連線')
      this.socket.emit('join_room', { roomId })
      this.currentRoomId = roomId
      sessionStorage.setItem('currentRoomId', roomId)
    },

    leaveRoom(roomId) {
      if (!this.canSendMessage) return
      this.socket.emit('leave_room', { roomId })

      if (this.currentRoomId === roomId) {
        this.currentRoomId = null
        sessionStorage.removeItem('currentRoomId')
      }
    },

    sendMessage(roomId, content, messageType = 'text', replyToId = null) {
      if (!this.canSendMessage) throw new Error('Socket 未連線')
      this.socket.emit('send_message', { roomId, content, messageType, replyToId })
    },

    startTyping(roomId) {
      if (!this.canSendMessage) return
      this.socket.emit('typing_start', { roomId })
    },

    stopTyping(roomId) {
      if (!this.canSendMessage) return
      this.socket.emit('typing_stop', { roomId })
    },

    getOnlineUsers(roomId = null) {
      if (!this.canSendMessage) return
      this.socket.emit('get_online_users', roomId ? { roomId } : {})
    },

    markMessagesRead(roomId, messageIds = []) {
      if (!this.canSendMessage) return
      this.socket.emit('mark_messages_read', { roomId, messageIds })
    },

    // 事件管理
    on(event, callback) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, new Set())
      }
      this.eventListeners.get(event).add(callback)
    },

    off(event, callback) {
      if (this.eventListeners.has(event)) {
        this.eventListeners.get(event).delete(callback)
      }
    },

    offAll() {
      this.eventListeners.clear()
    },

    emit(event, data) {
      if (this.eventListeners.has(event)) {
        this.eventListeners.get(event).forEach((callback) => {
          try {
            callback(data)
          } catch (err) {
            console.error(`事件處理器錯誤 (${event}):`, err)
          }
        })
      }
    },
  },
})
