<script setup>
import { computed } from 'vue'
import { useChat } from '../../composables/useChat.js'

const props = defineProps({
  chatroom: {
    type: Object,
    required: true,
  },
})

const { currentRoom } = useChat()

const isActive = computed(() => {
  return currentRoom.value?.roomId === props.chatroom.roomId
})

const formatLastMessageTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else {
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    })
  }
}

const getInitial = (type) => {
  if (type === 'private') {
    return '私'
  }
  return '群'
}
</script>

<template>
  <div
    :class="[
      'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
      isActive ? 'bg-blue-50 border-r-2 border-blue-600' : '',
    ]"
  >
    <div class="flex items-center space-x-3">
      <!-- 頭像 -->
      <div class="flex-shrink-0">
        <div class="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
          <span class="text-sm font-bold text-white">
            {{ getInitial(chatroom.roomType) }}
          </span>
        </div>
      </div>

      <!-- 聊天信息 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-900 truncate">
            {{ chatroom.displayName || '未命名聊天' }}
          </h3>
          <span class="text-xs text-gray-500">
            {{ formatLastMessageTime(chatroom.lastMessageAt) }}
          </span>
        </div>
        <p class="text-sm text-gray-500 truncate">
          {{ chatroom.lastMessage || '還沒有消息' }}
        </p>
      </div>
    </div>
  </div>
</template>
