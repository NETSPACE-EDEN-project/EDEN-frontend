<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../../composables/useAuth.js'
import { useChat } from '../../composables/useChat.js'

const { userName } = useAuth()
const { currentRoom, addMessage } = useChat()

const messageInput = ref('')

// 判斷是否可送出
const canSendMessage = computed(() => {
  return messageInput.value.trim().length > 0 && currentRoom.value
})

// 送出訊息
const sendMessage = async () => {
  if (!canSendMessage.value) return

  const messageText = messageInput.value.trim()
  messageInput.value = ''

  const newMessage = {
    id: Date.now(),
    content: messageText,
    senderId: userName.value,
    senderName: userName.value,
    createdAt: new Date().toISOString(),
    messageType: 'text',
  }

  addMessage(newMessage)

  // TODO: 發送到後端 WebSocket 或 API
}

// Enter 發送
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="p-4 mt-2 bg-white border-t border-gray-200 md-2">
    <div class="flex items-end space-x-3">
      <div class="flex-1">
        <textarea
          v-model="messageInput"
          @keydown="handleKeyDown"
          placeholder="輸入訊息..."
          rows="1"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        @click="sendMessage"
        :disabled="!canSendMessage"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors',
          canSendMessage
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
        ]"
      >
        發送
      </button>
    </div>
  </div>
</template>
