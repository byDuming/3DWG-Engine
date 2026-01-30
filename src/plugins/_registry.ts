/**
 * 插件注册中心
 * 
 * 使用 Vite 的 import.meta.glob 自动发现 plugins 目录下的所有插件
 * 
 * 插件目录结构要求：
 * - 每个插件必须是 src/plugins/{pluginName}/index.ts
 * - index.ts 必须默认导出一个 EnginePlugin 对象
 */

import type { EnginePlugin } from '@/core/plugin'

// 使用 Vite glob 自动扫描插件目录
// 匹配 ./*/index.ts 模式，即每个子目录下的 index.ts 文件
const pluginModules = import.meta.glob<{ default: EnginePlugin }>(
  './*/index.ts',
  { eager: true }
)

/** 所有可用的插件（自动发现） */
export const availablePlugins: Map<string, EnginePlugin> = new Map()

// 解析并注册发现的插件
for (const [path, module] of Object.entries(pluginModules)) {
  const plugin = module.default
  if (plugin?.id) {
    availablePlugins.set(plugin.id, plugin)
    console.log(`[PluginRegistry] Discovered plugin: ${plugin.id} (${plugin.name})`)
  } else {
    console.warn(`[PluginRegistry] Invalid plugin at ${path}: missing id or default export`)
  }
}

/**
 * 获取所有可用插件列表
 */
export function getAvailablePlugins(): EnginePlugin[] {
  return Array.from(availablePlugins.values())
}

/**
 * 根据 ID 获取插件
 */
export function getPluginById(pluginId: string): EnginePlugin | undefined {
  return availablePlugins.get(pluginId)
}

/**
 * 检查插件是否存在
 */
export function hasPlugin(pluginId: string): boolean {
  return availablePlugins.has(pluginId)
}

/**
 * 获取可用插件数量
 */
export function getPluginCount(): number {
  return availablePlugins.size
}

/**
 * 获取所有可用插件的 ID 列表
 */
export function getAvailablePluginIds(): string[] {
  return Array.from(availablePlugins.keys())
}
