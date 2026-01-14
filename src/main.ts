import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/route/index.ts'


import './style.css'
import App from './App.vue'

// 在开发环境下自动测试 Supabase 连接
if (import.meta.env.DEV) {
  import('@/utils/testSupabase').then(({ testSupabaseConnection }) => {
    // 延迟执行，确保应用已初始化
    setTimeout(() => {
      console.log('🚀 自动测试 Supabase 连接...')
      testSupabaseConnection().catch(console.error)
    }, 1000)
  })
}

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
