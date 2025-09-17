<script setup>
import { ref, computed } from 'vue'
import { useChat } from '../../composables/useChat.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'chat-created'])

const { createGroupChat, searchUsers } = useChat()

const groupData = ref({
  groupName: '',
  description: '',
  memberIds: [],
})

const searchKeyword = ref('')
const searchResults = ref([])
const selectedUsers = ref([])
const isCreating = ref(false)
const isSearching = ref(false)

const canCreateGroup = computed(() => {
  return groupData.value.groupName.trim().length > 0 && selectedUsers.value.length > 0
})

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return

  isSearching.value = true
  try {
    const result = await searchUsers(searchKeyword.value)
    if (result.success) {
      // 過濾已選擇的用戶
      const filteredUsers = (result.data.users || []).filter(
        (user) => !selectedUsers.value.some((selected) => selected.id === user.id),
      )
      searchResults.value = filteredUsers
    }
  } finally {
    isSearching.value = false
  }
}

const addUserToGroup = (user) => {
  selectedUsers.value.push(user)
  searchResults.value = searchResults.value.filter((u) => u.id !== user.id)
  searchKeyword.value = ''
  searchResults.value = []
}

const removeUserFromGroup = (userId) => {
  selectedUsers.value = selectedUsers.value.filter((user) => user.id !== userId)
}

const handleCreateGroup = async () => {
  isCreating.value = true
  try {
    // 準備群組數據
    const payload = {
      groupName: groupData.value.groupName.trim(),
      memberIds: selectedUsers.value.map((user) => user.id),
    }

    const result = await createGroupChat(payload)
    if (result.success) {
      emit('chat-created')
      resetModal()
    }
  } finally {
    isCreating.value = false
  }
}

const resetModal = () => {
  groupData.value = {
    groupName: '',
    description: '',
    memberIds: [],
  }
  selectedUsers.value = []
  searchKeyword.value = ''
  searchResults.value = []
  isCreating.value = false
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
    <div class="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">創建群組</h3>
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

      <div class="space-y-4">
        <!-- 群組名稱 -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">群組名稱</label>
          <input
            v-model="groupData.groupName"
            type="text"
            placeholder="請輸入群組名稱"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- 添加成員 -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">添加成員</label>

          <!-- 搜索用戶 -->
          <div class="flex mb-3 space-x-2">
            <input
              v-model="searchKeyword"
              @keydown.enter="handleSearch"
              type="text"
              placeholder="搜索用戶名"
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

          <!-- 搜索結果 -->
          <div
            v-if="searchResults.length > 0"
            class="p-2 mb-3 space-y-2 overflow-y-auto border rounded-lg max-h-40"
          >
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="flex items-center justify-between p-2 rounded hover:bg-gray-50"
            >
              <div class="flex items-center space-x-3">
                <div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                  <span class="text-xs font-bold text-white">
                    {{ getInitial(user.username) }}
                  </span>
                </div>
                <span class="text-sm font-medium">{{ user.username }}</span>
              </div>
              <button
                @click="addUserToGroup(user)"
                class="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
              >
                添加
              </button>
            </div>
          </div>

          <!-- 已選擇的用戶 -->
          <div v-if="selectedUsers.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-gray-700">
              已選擇成員 ({{ selectedUsers.length }})
            </div>
            <div class="p-2 space-y-2 overflow-y-auto border rounded-lg max-h-32">
              <div
                v-for="user in selectedUsers"
                :key="user.id"
                class="flex items-center justify-between p-2 rounded bg-blue-50"
              >
                <div class="flex items-center space-x-3">
                  <div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                    <span class="text-xs font-bold text-white">
                      {{ getInitial(user.username) }}
                    </span>
                  </div>
                  <span class="text-sm font-medium">{{ user.username }}</span>
                </div>
                <button
                  @click="removeUserFromGroup(user.id)"
                  class="p-1 text-red-600 hover:text-red-800"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 提示文字 -->
          <div v-if="selectedUsers.length === 0" class="text-sm text-gray-500">
            搜索並添加成員到群組中
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex justify-end pt-4 space-x-3 border-t">
          <button
            @click="resetModal"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            @click="handleCreateGroup"
            :disabled="!canCreateGroup || isCreating"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span v-if="isCreating">創建中...</span>
            <span v-else>創建群組</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
