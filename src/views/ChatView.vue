<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useChat } from '../composables/useChat.js'

const router = useRouter()
const { isAuthenticated } = useAuth()
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
  if (windowWidth.value >= 768) showSidebar.value = true
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const loadChatList = async () => {
  await getChatList()
}

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/auth')
    return
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
  <div class="z-10 flex items-center justify-center h-screen min-h-screen">
    <!-- 側邊欄遮罩（移動端） -->
    <div
      v-if="isMobile && showSidebar"
      @click="showSidebar = false"
      class="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
    />
  </div>
</template>
