/**
 * 认证状态管理 Store
 * 
 * 职责：
 * - 管理用户登录状态
 * - 提供登录/登出方法
 * - 监听 Supabase Auth 状态变化
 */

import { defineStore } from 'pinia'
import { ref, computed, watchEffect } from 'vue'
import { supabase } from '@/services/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {

  // ==================== 状态 ====================
  
  /** 当前用户 */
  const currentUser = ref<User | null>(null)
  
  /** 当前会话 */
  const session = ref<Session | null>(null)
  
  /** 是否正在加载认证状态 */
  const loading = ref(true)
  
  /** 登录错误信息 */
  const error = ref<string | null>(null)
  
  /** 登录对话框是否显示 */
  const showLoginDialog = ref(false)
  
  /** 登录成功后的回调 */
  let loginSuccessCallback: (() => void) | null = null

  // ==================== 计算属性 ====================
  
  /** 是否已登录 */
  const isLoggedIn = computed(() => !!currentUser.value)
  
  /** 用户邮箱 */
  const userEmail = computed(() => currentUser.value?.email ?? null)

  // ==================== 方法 ====================
  
  /**
   * 初始化认证状态
   * 监听 Supabase Auth 状态变化
   */
  async function initAuth() {
    loading.value = true
    
    try {
      // 获取当前会话
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      currentUser.value = currentSession?.user ?? null
      
      // 监听认证状态变化
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        currentUser.value = newSession?.user ?? null
      })
    } catch (err) {
      console.error('初始化认证状态失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 登录
   * @param email 邮箱
   * @param password 密码
   */
  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) {
        error.value = authError.message === 'Invalid login credentials' 
          ? '邮箱或密码错误' 
          : authError.message
        return false
      }
      
      session.value = data.session
      currentUser.value = data.user
      showLoginDialog.value = false
      
      // 执行登录成功回调
      if (loginSuccessCallback) {
        loginSuccessCallback()
        loginSuccessCallback = null
      }
      
      return true
    } catch (err: any) {
      error.value = err.message || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 登出
   */
  async function logout(): Promise<void> {
    loading.value = true
    
    try {
      await supabase.auth.signOut()
      session.value = null
      currentUser.value = null
    } catch (err) {
      console.error('登出失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 显示登录对话框
   * @param onSuccess 登录成功后的回调
   * @returns Promise，登录成功时 resolve true，取消时 resolve false
   */
  function openLoginDialog(onSuccess?: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      error.value = null
      showLoginDialog.value = true
      
      // 设置登录成功回调
      loginSuccessCallback = () => {
        resolve(true)
        if (onSuccess) onSuccess()
      }
      
      // 监听对话框关闭
      const unwatch = watchEffect(() => {
        if (!showLoginDialog.value && !isLoggedIn.value) {
          // 对话框关闭但未登录，说明用户取消了
          resolve(false)
          loginSuccessCallback = null
          unwatch()
        }
      })
    })
  }
  
  /**
   * 关闭登录对话框
   */
  function closeLoginDialog() {
    showLoginDialog.value = false
    loginSuccessCallback = null
  }
  
  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null
  }

  // ==================== 返回 ====================
  
  return {
    // 状态
    currentUser,
    session,
    loading,
    error,
    showLoginDialog,
    
    // 计算属性
    isLoggedIn,
    userEmail,
    
    // 方法
    initAuth,
    login,
    logout,
    openLoginDialog,
    closeLoginDialog,
    clearError
  }
})
