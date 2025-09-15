<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useChat } from '../composables/useChat.js'

import ChatSidebar from '../components/chat/ChatSidebar.vue'
import ChatMainArea from '../components/chat/ChatMainArea.vue'
import SearchUserModal from '../components/chat/SearchUserModal.vue'
import CreateGroupModal from '../components/chat/CreateGroupModal.vue'

const router = useRouter()
const { isAuthenticated } = useAuth()
const { getChatList, clearChatData } = useChat()

// 響應式數據
const showSidebar = ref(true)
const showUserSearch = ref(false)
const showCreateGroup = ref(false)

// 計算屬性
const isMobile = computed(() => window.innerWidth < 768)

// 方法
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const handleSidebarToggle = () => {
  if (isMobile.value) {
    showSidebar.value = false
  }
}

const loadChatList = async () => {
  await getChatList()
}

// 生命週期
onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/auth')
    return
  }

  await loadChatList()

  // 響應式處理
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      showSidebar.value = true
    }
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    clearChatData()
  })
})
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 側邊欄 -->
    <ChatSidebar
      :show="showSidebar"
      :is-mobile="isMobile"
      @toggle="toggleSidebar"
      @show-user-search="showUserSearch = true"
      @show-create-group="showCreateGroup = true"
      @chat-selected="handleSidebarToggle"
      @reload-chats="loadChatList"
    />

    <!-- 主聊天區域 -->
    <ChatMainArea
      :is-mobile="isMobile"
      :show-sidebar="showSidebar"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- 搜索用戶模態框 -->
    <SearchUserModal
      :show="showUserSearch"
      @close="showUserSearch = false"
      @chat-created="loadChatList"
    />

    <!-- 創建群組模態框 -->
    <CreateGroupModal
      :show="showCreateGroup"
      @close="showCreateGroup = false"
      @group-created="loadChatList"
    />

    <!-- 移動端側邊欄遮罩 -->
    <div
      v-if="isMobile && showSidebar"
      @click="showSidebar = false"
      class="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
    />
  </div>
</template>
