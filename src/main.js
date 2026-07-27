import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// 開発時のみ、?mock=1 で Googleカレンダーのモックを有効にする。
// import.meta.env.DEV が false の本番ビルドでは動的 import ごと除去される
if (import.meta.env.DEV) {
  const { setupCalendarMock } = await import('./mocks/calendarMock')
  setupCalendarMock()
}

const app = createApp(App)
app.use(router)
app.mount('#app')
