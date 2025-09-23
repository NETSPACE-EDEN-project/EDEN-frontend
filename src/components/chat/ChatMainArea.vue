<script setup>
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useChat } from '../../composables/useChat.js'

import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

const props = defineProps({
  isMobile: { type: Boolean, default: false },
  showSidebar: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle-sidebar'])

const { currentRoom, messages, messagePagination, getChatMessages, incrementMessagePage } =
  useChat()
const hasCurrentRoom = computed(() => !!currentRoom.value)

// 滾動容器
const scrollContainer = ref(null)
const isFetching = ref(false)

// 滾動到底部
const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// 上拉載入更多歷史訊息
const handleScroll = async () => {
  const el = scrollContainer.value
  if (!el || !currentRoom.value || !messagePagination.value) return

  if (el.scrollTop === 0 && messagePagination.value.hasMore) {
    isFetching.value = true
    const previousHeight = el.scrollHeight

    const { pagination } = await getChatMessages(currentRoom.value.roomId, {
      page: messagePagination.value.current + 1,
      limit: messagePagination.value.limit,
    })

    incrementMessagePage(pagination)

    await nextTick()
    el.scrollTop = el.scrollHeight - previousHeight

    isFetching.value = false
  }
}
// 監聽訊息變化
watch(messages, scrollToBottom, { deep: true })

// 監聽房間變化
watch(currentRoom, scrollToBottom)

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll)
  }
})
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

    <!-- 訊息列表 -->
    <div ref="scrollContainer" class="flex-1 p-4 mt-2 overflow-y-auto bg-gray-50">
      <MessageList :is-mobile="isMobile" />
    </div>

    <!-- 輸入框固定底部 -->
    <div v-if="currentRoom" class="z-10 border-t border-gray-200 bg-white/50">
      <MessageInput />
    </div>
  </div>
</template>
