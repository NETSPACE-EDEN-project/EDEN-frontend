import { useSocketStore } from '../stores/socket.js'

export function useSocket() {
  const socketStore = useSocketStore()

  // 初始化 socket（刷新後自動加入房間）
  const init = (url, options = {}) => {
    socketStore.connect(url, options)

    // 如果 sessionStorage 有房間，刷新後自動 join
    const savedRoomId = sessionStorage.getItem('currentRoomId')
    if (savedRoomId) {
      socketStore.joinRoom(savedRoomId)
    }
  }

  const connect = () => socketStore.connect()
  const disconnect = () => socketStore.disconnect()
  const joinRoom = (roomId) => socketStore.joinRoom(roomId)
  const leaveRoom = (roomId) => socketStore.leaveRoom(roomId)
  const sendMessage = (roomId, content) => socketStore.sendMessage(roomId, content)
  const startTyping = (roomId) => socketStore.startTyping(roomId)
  const stopTyping = (roomId) => socketStore.stopTyping(roomId)
  const offAll = () => socketStore.offAll()

  return {
    socketStore,
    init,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    offAll,
  }
}
