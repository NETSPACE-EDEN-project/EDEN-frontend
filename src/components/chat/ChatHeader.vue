<script setup>
import { useChat } from '../../composables/useChat.js'

const props = defineProps({
  hasCurrentRoom: {
    type: Boolean,
    default: false,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-sidebar'])

const { currentRoom } = useChat()

const getInitial = (name, type) => {
  if (type === 'private') {
    return '私'
  }
  return '群'
}
</script>

<template>
  <div class="flex items-center justify-between p-4 bg-white border-b border-gray-200">
    <div class="flex items-center space-x-3">
      <!-- 移動端菜單按鈕 -->
      <button
        @click="emit('toggle-sidebar')"
        class="p-2 text-gray-500 rounded-lg hover:bg-gray-100 md:hidden"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <!-- 當前聊天信息 -->
      <div v-if="hasCurrentRoom" class="flex items-center space-x-3">
        <div class="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
          <span class="text-sm font-bold text-white">
            {{ getInitial(chat.roomName, chat.roomType) }}
          </span>
        </div>
        <div>
          <h3 class="font-medium text-gray-900">{{ currentRoom.roomName || '未命名聊天' }}</h3>
          <p class="text-sm text-gray-500">
            {{ currentRoom.isGroup ? `${currentRoom.memberCount || 0} 位成員` : '私人聊天' }}
          </p>
        </div>
      </div>

      <div v-else class="text-gray-500">選擇一個聊天開始對話</div>
    </div>

    <!-- 聊天操作按鈕 -->
    <div v-if="hasCurrentRoom" class="flex items-center space-x-2">
      <button class="p-2 text-gray-500 rounded-lg hover:bg-gray-100">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
