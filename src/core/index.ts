/**
 * Core 模块导出
 */

// 插件系统
export * from './plugin'
export { pluginManager, usePluginManager } from './pluginManager'
export * from './pluginStorage'

// 插件注册中心
export { getAvailablePlugins, availablePlugins } from '@/plugins/_registry'
