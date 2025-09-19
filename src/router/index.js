import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/HomeView.vue'
import Auth from '../views/AuthView.vue'
import Chat from '../views/ChatView.vue'
import EmailVerify from '../views/EmailVerifyView.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },
  { path: '/auth', name: 'Auth', component: Auth },
  { path: '/verify-email', name: 'VerifyEmail', component: EmailVerify },
  { path: '/chat', name: 'Chat', component: Chat, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
