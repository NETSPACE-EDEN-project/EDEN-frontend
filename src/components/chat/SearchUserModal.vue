<script setup>
import { ref } from 'vue'
import { useChat } from '../../composables/useChat.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'chat-created'])

const { searchUsers, startPrivateChat } = useChat()

const searchKeyword = ref('')
const searchResults = ref([])
const isSearching = ref(false)

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return

  isSearching.value = true
  try {
    const result = await searchUsers(searchKeyword.value)
    console.log('完整的 API 回應:', result)

    if (result.success) {
      searchResults.value = result.data.users || []
    }
  } finally {
    isSearching.value = false
  }
}

const startChatWithUser = async (userId) => {
  console.log('Starting chat with userId:', userId)

  if (!userId) {
    console.error('用戶ID不能為空')
    return
  }

  try {
    const result = await startPrivateChat(userId)
    if (result.success) {
      emit('chat-created')
      resetModal()
    } else {
      console.error('創建聊天失敗：', result)
    }
  } catch (error) {
    console.error('創建聊天時發生錯誤：', error)
  }
}

const resetModal = () => {
  searchKeyword.value = ''
  searchResults.value = []
  isSearching.value = false
  emit('close')
}

const getInitial = (name) => {
  return name ? name[0].toUpperCase() : 'U'
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-white/80"
  >
    <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">搜索用戶</h3>
        <button @click="resetModal" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 搜索輸入 -->
      <div class="mb-4">
        <div class="flex space-x-2">
          <input
            v-model="searchKeyword"
            @keydown.enter="handleSearch"
            type="text"
            placeholder="輸入用戶名"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            @click="handleSearch"
            :disabled="isSearching || !searchKeyword.trim()"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span v-if="isSearching">搜索中...</span>
            <span v-else>搜索</span>
          </button>
        </div>
      </div>

      <!-- 搜索結果 -->
      <div v-if="searchResults.length > 0" class="space-y-2 overflow-y-auto max-h-96">
        <div
          v-for="user in searchResults"
          :key="user.userId || user.id || user._id"
          class="flex items-center justify-between p-3 space-x-3 rounded-lg hover:bg-gray-50"
        >
          <!-- 用戶資訊 -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              <span class="text-sm font-bold text-white">
                {{ getInitial(user.username) }}
              </span>
            </div>
            <div>
              <div class="font-medium">{{ user.username }}</div>
            </div>
          </div>

          <!-- 創建聊天室按鈕 -->
          <button
            @click="startChatWithUser(user.id)"
            class="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            +
          </button>
        </div>
      </div>

      <!-- 無結果狀態 -->
      <div
        v-else-if="searchKeyword && searchResults.length === 0 && !isSearching"
        class="py-8 text-center text-gray-500"
      >
        沒有找到相關用戶
      </div>

      <!-- 搜索提示 -->
      <div v-else-if="!searchKeyword" class="py-8 text-center text-gray-400">
        <svg
          class="w-12 h-12 mx-auto mb-2 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p class="text-sm">輸入用戶名開始搜索</p>
      </div>
    </div>
  </div>
</template>
