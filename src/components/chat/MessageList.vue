<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useAuth } from '../../composables/useAuth.js'
import { useChat } from '../../composables/useChat.js'
import ChatEmptyState from './ChatEmptyState.vue'

const { userName } = useAuth()
const { currentRoom, messages } = useChat()

const messagesContainer = ref(null)

// 計算當前用戶ID（這裡簡化為用戶名）
const currentUserId = computed(() => userName.value)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 監聽消息變化，自動滾動到底部
watch(
  messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

// 監聽當前房間變化，滾動到底部
watch(currentRoom, () => {
  scrollToBottom()
})
</script>

<template>
  <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto bg-gray-50 h-60 md:h-165">
    <!-- 空狀態 -->
    <div v-if="messages.length === 0" class="flex items-center justify-center h-full text-gray-500">
      <ChatEmptyState />
    </div>
  </div>
</template>
