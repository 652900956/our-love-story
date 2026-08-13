/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  // 颜色/字体/圆角/动画时长均由 src/config/theme.config.ts 驱动，
  // 这里仅保留布局工具类，避免主题相关硬编码。
  plugins: [],
}
