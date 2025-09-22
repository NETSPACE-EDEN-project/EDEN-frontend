<script setup>
import { useChat } from '../../composables/useChat.js'
import ChatListItem from './ChatListItem.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'toggle',
  'show-user-search',
  'show-create-group',
  'chat-selected',
  'reload-chats',
])

const { chatList, setCurrentRoom, getChatMessages, isLoading, clearChatData } = useChat()

const selectChat = async (chatroom) => {
  clearChatData()
  setCurrentRoom(chatroom)
  await getChatMessages(chatroom.roomId)
  emit('chat-selected', chatroom)
}
</script>

<template>
  <div
    :class="[
      'transition-all duration-300 bg-white border-r flex flex-col',
      isMobile
        ? ['fixed inset-y-0 left-0 z-30 w-80', show ? 'translate-x-0' : '-translate-x-full']
        : ['fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 z-10'],
    ]"
  >
    <!-- 頭部 -->
    <div class="flex flex-col gap-2 p-4 border-b">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">聊天室</h2>
        <button @click="emit('toggle')" class="p-2 md:hidden">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex gap-2">
        <button
          @click="emit('show-user-search')"
          class="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
        >
          新增聊天
        </button>
        <button
          @click="emit('show-create-group')"
          class="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          創建群組
        </button>
      </div>
    </div>

    <!-- 聊天列表 -->
    <div class="flex-1 p-2 overflow-y-auto">
      <div v-if="chatList.length === 0" class="py-4 text-center text-gray-500">
        <p class="text-sm">還沒有聊天記錄</p>
        <p class="text-xs text-gray-400">開始新的對話吧！</p>
      </div>
      <div v-else class="flex-1 p-2 overflow-y-auto">
        <ChatListItem
          v-for="chatroom in chatList"
          :key="chatroom.roomId"
          :chatroom="chatroom"
          @click="selectChat(chatroom)"
        />
      </div>
    </div>
  </div>
</template>
