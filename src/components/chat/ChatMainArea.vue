<script setup>
import { computed } from 'vue'
import { useChat } from '../../composables/useChat.js'

import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

const props = defineProps({
  isMobile: { type: Boolean, default: false },
  showSidebar: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle-sidebar'])

const { currentRoom } = useChat()
const hasCurrentRoom = computed(() => !!currentRoom.value)
</script>

<template>
  <!-- 主區域 -->
  <div
    :class="['flex flex-col h-full transition-all duration-300', isMobile ? 'flex-1' : 'flex-1']"
    :style="!isMobile ? { marginLeft: showSidebar ? '20rem' : '0' } : {}"
  >
    <!-- 頭部固定 -->
    <ChatHeader
      class="sticky top-0 z-10"
      :has-current-room="hasCurrentRoom"
      :is-mobile="isMobile"
      @toggle-sidebar="emit('toggle-sidebar')"
    />

    <!-- 訊息滾動區域 -->
    <div class="flex-1 p-4 mt-2 overflow-y-auto bg-gray-50">
      <MessageList :is-mobile="isMobile" />
    </div>

    <!-- 輸入框固定底部 -->
    <div class="z-10 border-t border-gray-200 bg-white/50">
      <MessageInput />
    </div>
  </div>
</template>
