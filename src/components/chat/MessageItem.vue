<script setup>
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  isOwnMessage: {
    type: Boolean,
    default: false,
  },
  showSenderName: {
    type: Boolean,
    default: false,
  },
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div :class="['flex w-full', isOwnMessage ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'px-4 py-2 rounded-lg break-words whitespace-pre-wrap',
        isOwnMessage
          ? 'bg-blue-600 text-white max-w-[75%]'
          : 'bg-white text-gray-900 border border-gray-200 max-w-[75%]',
      ]"
    >
      <!-- 發送者名稱 -->
      <div v-if="showSenderName" class="mb-1 text-xs opacity-75">
        {{ message.senderName }}
      </div>

      <!-- 消息內容 -->
      <div>{{ message.content }}</div>

      <!-- 時間戳 -->
      <div :class="['text-xs mt-1', isOwnMessage ? 'text-blue-100' : 'text-gray-500']">
        {{ formatTime(message.createdAt) }}
      </div>
    </div>
  </div>
</template>
