/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 * 
 * BASE_URL 是 Vite 内置的环境变量，对应 vite.config.ts 中的 base 配置
 * 不需要在 .env 文件中定义，Vite 会自动注入
 */
interface ImportMetaEnv {
  readonly BASE_URL: string
  // 如果以后需要自定义环境变量，可以在这里添加
  // 例如：readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
