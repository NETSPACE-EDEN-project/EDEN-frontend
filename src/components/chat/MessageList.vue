<script setup>
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth.js'
import { useChat } from '../../composables/useChat.js'

import ChatEmptyState from './ChatEmptyState.vue'
import MessageItem from './MessageItem.vue'

const { userId } = useAuth()
const { currentRoom, messages } = useChat()

const currentUserId = computed(() => userId.value)
</script>

<template>
  <div class="flex flex-col flex-1">
    <!-- 未選聊天室 -->
    <div v-if="!currentRoom" class="flex items-center justify-center flex-1 text-gray-500">
      <ChatEmptyState text="請選擇一個聊天室開始對話" />
    </div>

    <!-- 已選聊天室，但沒有訊息 -->
    <div
      v-else-if="messages.length === 0"
      class="flex items-center justify-center flex-1 text-gray-500"
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
        :show-sender-name="message.senderId !== currentUserId"
      />
    </div>
  </div>
</template>
