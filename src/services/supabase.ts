import { createClient } from '@supabase/supabase-js'

// Supabase 配置
// 这些值需要从 Supabase 项目设置中获取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 只在开发环境显示警告，生产环境静默处理（应用会自动回退到本地存储）
if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  console.info('ℹ️ Supabase 未配置，应用将使用本地存储模式。如需云同步功能，请配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

// 创建 Supabase 客户端（即使配置缺失也会创建，但不会正常工作）
// 应用代码会检查配置并自动回退到本地存储
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 数据库表名
export const TABLES = {
  SCENES: 'scenes',
  USERS: 'users'
} as const
