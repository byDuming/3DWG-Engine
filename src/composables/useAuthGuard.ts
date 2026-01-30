/**
 * 权限检查 Composable
 * 
 * 用于在需要权限的操作前检查登录状态
 * 如果未登录，会自动弹出登录对话框
 */

import { useAuthStore } from '@/stores/modules/useAuth.store'

export function useAuthGuard() {
  const authStore = useAuthStore()

  /**
   * 检查权限
   * 如果未登录，会弹出登录对话框
   * @returns Promise<boolean> - 是否通过权限检查（已登录或登录成功）
   */
  async function requireAuth(): Promise<boolean> {
    // 已登录，直接返回 true
    if (authStore.isLoggedIn) {
      return true
    }
    
    // 未登录，打开登录对话框并等待结果
    return new Promise((resolve) => {
      authStore.showLoginDialog = true
      
      // 监听登录状态变化
      const checkInterval = setInterval(() => {
        // 如果登录成功
        if (authStore.isLoggedIn) {
          clearInterval(checkInterval)
          resolve(true)
        }
        // 如果对话框关闭但未登录（用户取消）
        else if (!authStore.showLoginDialog) {
          clearInterval(checkInterval)
          resolve(false)
        }
      }, 100)
    })
  }

  /**
   * 检查是否已登录（不弹出对话框）
   */
  function isAuthenticated(): boolean {
    return authStore.isLoggedIn
  }

  /**
   * 打开登录对话框
   */
  function openLogin() {
    authStore.showLoginDialog = true
  }

  return {
    requireAuth,
    isAuthenticated,
    openLogin
  }
}
