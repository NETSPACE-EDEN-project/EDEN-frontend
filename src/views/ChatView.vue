<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useChat } from '../composables/useChat.js'

import ChatSidebar from '../components/chat/ChatSidebar.vue'
import ChatMainArea from '../components/chat/ChatMainArea.vue'
import SearchUserModal from '../components/chat/SearchUserModal.vue'
import CreateGroupModal from '../components/chat/CreateGroupModal.vue'

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

const showSidebar = ref(true)
const showUserSearch = ref(false)
const showCreateGroup = ref(false)
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)

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
  <SearchUserModal
    :show="showUserSearch"
    @close="showUserSearch = false"
    @chat-created="loadChatList"
  />

  <CreateGroupModal
    :show="showCreateGroup"
    @close="showCreateGroup = false"
    @chat-created="loadChatList"
  />

  <div class="flex h-screen overflow-hidden bg-transparent">
    <!-- 側邊欄 -->
    <ChatSidebar
      :show="showSidebar"
      :is-mobile="isMobile"
      @toggle="toggleSidebar"
      @show-user-search="showUserSearch = true"
      @show-create-group="showCreateGroup = true"
      @chat-selected="handleChatSelected"
      @reload-chats="loadChatList"
    />

    <!-- 主要內容區域 -->
    <div class="flex flex-col flex-1 bg-transparent">
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
      <ChatMainArea
        :is-mobile="isMobile"
        :show-sidebar="showSidebar"
        @toggle-sidebar="toggleSidebar"
        class="flex-1"
      />
    </div>

    <!-- 移動端側邊欄遮罩 -->
    <div
      v-if="isMobile && showSidebar"
      @click="showSidebar = false"
      class="fixed inset-0 z-20 bg-black/50 md:hidden"
    />
  </div>
</template>
