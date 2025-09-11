<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '載入中...',
  },
})
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="p-4 bg-white rounded shadow-lg">
      <div class="flex items-center space-x-3">
        <!-- Spinner -->
        <div
          class="w-6 h-6 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"
        ></div>
        <!-- 訊息 -->
        <span>{{ message }}</span>
      </div>
    </div>
  </div>
</template>
