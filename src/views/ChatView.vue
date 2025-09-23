<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useChat } from '../composables/useChat.js'
import { useAuthStore } from '../stores/auth.js'

import ChatSidebar from '../components/chat/ChatSidebar.vue'
import ChatMainArea from '../components/chat/ChatMainArea.vue'
import SearchUserModal from '../components/chat/SearchUserModal.vue'
import CreateGroupModal from '../components/chat/CreateGroupModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated } = useAuth()
const { getChatList, clearChatData } = useChat()

const showSidebar = ref(true)
const showUserSearch = ref(false)
const showCreateGroup = ref(false)
const windowWidth = ref(window.innerWidth)
const hasInitialized = ref(false)

const isMobile = computed(() => windowWidth.value < 768)

const handleResize = () => {
  windowWidth.value = window.innerWidth
  showSidebar.value = windowWidth.value >= 768
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const loadChatList = async () => {
  await getChatList()
}

const handleChatSelected = (chat) => {
  if (isMobile.value) showSidebar.value = false
}

const initializeChatView = async () => {
  if (hasInitialized.value) return

  if (!isAuthenticated.value) {
    router.push('/auth')
    return
  }

  hasInitialized.value = true
  if (isMobile.value) showSidebar.value = false
  await loadChatList()
}

// 監聽認證狀態變化
watch(
  () => authStore.isLoading,
  async (loading) => {
    if (loading === false && !hasInitialized.value) {
      await initializeChatView()
    }
  },
)

onMounted(async () => {
  window.addEventListener('resize', handleResize)

  if (!authStore.isLoading) {
    await initializeChatView()
  }
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
    <ChatSidebar
      :show="showSidebar"
      :is-mobile="isMobile"
      @toggle="toggleSidebar"
      @show-user-search="showUserSearch = true"
      @show-create-group="showCreateGroup = true"
      @chat-selected="handleChatSelected"
      @reload-chats="loadChatList"
    />

    <div class="flex flex-col flex-1 bg-transparent">
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

      <ChatMainArea
        :is-mobile="isMobile"
        :show-sidebar="showSidebar"
        @toggle-sidebar="toggleSidebar"
        class="flex-1"
      />
    </div>

    <div
      v-if="isMobile && showSidebar"
      @click="showSidebar = false"
      class="fixed inset-0 z-20 bg-black/50 md:hidden"
    />
  </div>
</template>
