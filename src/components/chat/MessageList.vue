<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useAuth } from '../../composables/useAuth.js'
import { useChat } from '../../composables/useChat.js'

import ChatEmptyState from './ChatEmptyState.vue'
import MessageItem from './MessageItem.vue'

const { userId } = useAuth()
const { currentRoom, messages } = useChat()

const messagesContainer = ref(null)

// 計算當前用戶ID
const currentUserId = computed(() => userId.value)

// 自動滾動到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 監聽消息變化
watch(messages, () => scrollToBottom(), { deep: true })

// 監聽聊天室變化
watch(currentRoom, () => scrollToBottom())
</script>

<template>
  <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto bg-gray-50">
    <!-- 未選聊天室 -->
    <div v-if="!currentRoom" class="flex flex-col items-center justify-center h-full text-gray-500">
      <ChatEmptyState text="請選擇一個聊天室開始對話" />
    </div>

    <!-- 已選聊天室，但沒有訊息 -->
    <div
      v-else-if="messages.length === 0"
      class="flex flex-col items-center justify-center h-full text-gray-500"
    >
      <p>尚無訊息</p>
    </div>

    <!-- 有訊息 -->
    <div v-else class="space-y-4">
      <MessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :is-own-message="message.senderId === currentUserId"
        :show-sender-name="currentRoom?.isGroup && message.senderId !== currentUserId"
      />
    </div>
  </div>
</template>
