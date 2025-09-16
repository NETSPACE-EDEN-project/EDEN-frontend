<script setup>
import { computed } from 'vue'
import { useChat } from '../../composables/useChat.js'

import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false,
  },
  showSidebar: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toggle-sidebar'])

const { currentRoom } = useChat()

const hasCurrentRoom = computed(() => !!currentRoom.value)
</script>

<template>
  <div class="flex flex-col flex-1">
    <!-- 頭部固定 -->
    <div class="sticky top-0 z-10 p-2 bg-white/50">
      <ChatHeader
        :has-current-room="hasCurrentRoom"
        :is-mobile="isMobile"
        @toggle-sidebar="emit('toggle-sidebar')"
      />
    </div>

    <!-- 主要內容區域 -->
    <div class="top-0 z-10 p-2 mt-2 h-100 md:h-217 bg-white/50">
      <MessageList :is-mobile="isMobile" />
    </div>
  </div>
</template>
