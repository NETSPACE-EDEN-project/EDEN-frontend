<script setup>
import { computed } from 'vue'
import { useChat } from '../../composables/useChat.js'

import ChatEmptyState from './ChatEmptyState.vue'

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
  <div class="flex flex-col flex-1 p-4">
    <!-- 主要內容區域 -->
    <div v-if="hasCurrentRoom" class="flex flex-col flex-1"></div>

    <!-- 空狀態 -->
    <ChatEmptyState v-else />
  </div>
</template>
