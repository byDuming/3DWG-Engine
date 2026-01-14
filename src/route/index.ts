import { createWebHistory, createRouter } from 'vue-router'

import SceneList from '@/views/SceneList.vue'
import EnginePanel from '@/views/EnginePanel.vue'

const routes = [
  { path: '/', component: SceneList },
  { path: '/engine', component: EnginePanel },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router;