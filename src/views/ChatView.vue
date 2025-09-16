<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useChat } from '../composables/useChat.js'

import ChatSidebar from '../components/chat/ChatSidebar.vue'
import ChatMainArea from '../components/chat/ChatMainArea.vue'

const router = useRouter()
const { isAuthenticated, verifyAuthStatus } = useAuth()
const {
  chatList,
  currentRoom,
  messages,
  isLoading,
  getChatList,
  setCurrentRoom,
  addMessage,
  clearChatData,
} = useChat()

// 響應式數據
const showSidebar = ref(true)
const windowWidth = ref(window.innerWidth)

// 計算屬性
const isMobile = computed(() => windowWidth.value < 768)

// 方法
const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) {
    showSidebar.value = true
  } else {
    showSidebar.value = false
  }
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const loadChatList = async () => {
  await getChatList()
}

const handleChatSelected = (chat) => {
  if (isMobile.value) {
    showSidebar.value = false
  }
}

onMounted(async () => {
  const authResult = await verifyAuthStatus()
  if (!authResult.success) {
    router.push('/auth')
    return
  }
  await nextTick()

  if (isMobile.value) {
    showSidebar.value = false
  }

  await loadChatList()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearChatData()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-transparent">
    <!-- 側邊欄 -->
    <ChatSidebar
      :show="showSidebar"
      :is-mobile="isMobile"
      @toggle="toggleSidebar"
      @show-user-search="() => {}"
      @show-create-group="() => {}"
      @chat-selected="handleChatSelected"
      @reload-chats="loadChatList"
    />

    <!-- 主要內容區域 -->
    <div class="relative flex flex-col flex-1 bg-transparent">
      <!-- 移動端左側切換按鈕 -->
      <button
        v-if="isMobile"
        @click="toggleSidebar"
        class="fixed z-30 p-2 transition-all duration-300 transform -translate-y-1/2 bg-white border rounded-r-lg shadow-md top-1/2"
        :class="showSidebar ? 'left-80' : 'left-0'"
      >
        <svg
          class="w-5 h-5 text-gray-600 transition-transform duration-300"
          :class="{ 'rotate-180': showSidebar }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- 主聊天內容 -->
      <div class="flex items-center justify-center flex-1 bg-transparent md:ml-80">
        <ChatMainArea
          :is-mobile="isMobile"
          :show-sidebar="showSidebar"
          @toggle-sidebar="toggleSidebar"
        />
      </div>
    </div>

    <!-- 移動端側邊欄遮罩 -->
    <div
      v-if="isMobile && showSidebar"
      @click="showSidebar = false"
      class="fixed inset-0 z-20 bg-black/50 md:hidden"
    />
  </div>
</template>
