import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    currentRoomId: null, // 用來刷新後自動 join
  }),
  actions: {
    connect(url, options = {}) {
      if (this.socket && this.isConnected) return

      this.socket = io(url, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        ...options,
      })

      // 事件監聽
      this.socket.on('connect', () => {
        console.log('Socket connected', this.socket.id)
        this.isConnected = true
        this.reconnectAttempts = 0

        // 斷線重連後，自動重新加入房間
        if (this.currentRoomId) {
          this.joinRoom(this.currentRoomId)
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        this.isConnected = false
        if (reason !== 'io client disconnect') this.handleReconnection()
      })

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error', err)
        this.isConnected = false
        this.handleReconnection()
      })

      this.socket.connect()
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      this.isConnected = false
      this.reconnectAttempts = 0
    },

    handleReconnection() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Reached max reconnect attempts')
        return
      }
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      setTimeout(() => {
        if (!this.isConnected && this.socket) this.socket.connect()
      }, delay)
    },

    joinRoom(roomId) {
      if (!this.isConnected || !this.socket) return
      this.socket.emit('join_room', { roomId })
      this.currentRoomId = roomId
      sessionStorage.setItem('currentRoomId', roomId)
    },

    leaveRoom(roomId) {
      if (!this.isConnected || !this.socket) return
      this.socket.emit('leave_room', { roomId })
      if (this.currentRoomId === roomId) {
        this.currentRoomId = null
        sessionStorage.removeItem('currentRoomId')
      }
    },

    sendMessage(roomId, content) {
      if (!this.isConnected || !this.socket) return
      this.socket.emit('send_message', { roomId, content })
    },

    startTyping(roomId) {
      if (!this.isConnected || !this.socket) return
      this.socket.emit('typing_start', { roomId })
    },

    stopTyping(roomId) {
      if (!this.isConnected || !this.socket) return
      this.socket.emit('typing_stop', { roomId })
    },

    offAll() {
      if (!this.socket) return
      this.socket.removeAllListeners()
    },
  },
})
