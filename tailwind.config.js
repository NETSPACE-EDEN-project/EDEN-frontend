export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 覆蓋預設的 sans 字體
        sans: [
          'Inter',
          '思源黑體',
          'Noto Sans CJK TC',
          'Microsoft YaHei',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],

        // 聊天室專用字體
        chat: ['Inter', '思源黑體', 'Noto Sans CJK TC', 'Microsoft YaHei', 'sans-serif'],

        // UI 介面字體（按鈕、選單等）
        ui: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
