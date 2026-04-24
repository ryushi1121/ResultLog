import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

const app = createApp(App)
app.use(router)
app.mount('#app')
