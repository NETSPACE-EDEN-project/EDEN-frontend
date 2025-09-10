<script setup></script>

<template>
  <!-- 浮水印 -->
  <div
    class="fixed inset-0 bg-[url('../public/brandImage.jpg')] bg-center bg-cover bg-no-repeat bg-fixed pointer-events-none z-[-1]"
  ></div>

  <!-- 主要內容 -->
  <div class="fixed inset-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-white/85"></div>
</template>

<style>
/* 只保留 Tailwind 無法處理的全局樣式 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  -webkit-overflow-scrolling: touch;
}

* {
  box-sizing: border-box;
}
</style>
