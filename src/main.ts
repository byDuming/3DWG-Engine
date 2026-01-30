import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/route/index.ts'


import './style.css'
import App from './App.vue'


const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')

// 初始化认证状态
import { useAuthStore } from '@/stores/modules/useAuth.store'
const authStore = useAuthStore(pinia)
authStore.initAuth()
