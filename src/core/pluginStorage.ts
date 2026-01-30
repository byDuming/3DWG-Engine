/**
 * 插件存储模块
 * 
 * 负责插件状态和配置的持久化存储
 * 使用 localStorage 存储插件的启用状态和配置
 */

export interface PluginState {
  /** 是否启用 */
  enabled: boolean
  /** 插件配置 */
  config?: Record<string, any>
}

export interface PluginStatesData {
  [pluginId: string]: PluginState
}

const STORAGE_KEY = '3dwg-plugin-states'

/**
 * 从 localStorage 加载所有插件状态
 */
export function loadPluginStates(): Map<string, PluginState> {
  const states = new Map<string, PluginState>()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data: PluginStatesData = JSON.parse(stored)
      for (const [pluginId, state] of Object.entries(data)) {
        states.set(pluginId, state)
      }
    }
  } catch (error) {
    console.error('[PluginStorage] Failed to load plugin states:', error)
  }
  
  return states
}

/**
 * 保存所有插件状态到 localStorage
 */
function saveAllStates(states: Map<string, PluginState>): void {
  try {
    const data: PluginStatesData = {}
    for (const [pluginId, state] of states) {
      data[pluginId] = state
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('[PluginStorage] Failed to save plugin states:', error)
  }
}

/**
 * 保存单个插件的状态
 */
export function savePluginState(pluginId: string, state: PluginState): void {
  const states = loadPluginStates()
  states.set(pluginId, state)
  saveAllStates(states)
}

/**
 * 获取插件的启用状态
 * @param pluginId 插件ID
 * @param defaultValue 默认值（如果没有存储的状态）
 */
export function isPluginEnabled(pluginId: string, defaultValue = false): boolean {
  const states = loadPluginStates()
  const state = states.get(pluginId)
  return state?.enabled ?? defaultValue
}

/**
 * 设置插件的启用状态
 */
export function setPluginEnabled(pluginId: string, enabled: boolean): void {
  const states = loadPluginStates()
  const existing = states.get(pluginId) || { enabled: false }
  existing.enabled = enabled
  states.set(pluginId, existing)
  saveAllStates(states)
}

/**
 * 获取插件配置
 */
export function getPluginConfig<T extends Record<string, any>>(pluginId: string): T | undefined {
  const states = loadPluginStates()
  const state = states.get(pluginId)
  return state?.config as T | undefined
}

/**
 * 设置插件配置
 */
export function setPluginConfig<T extends Record<string, any>>(pluginId: string, config: T): void {
  const states = loadPluginStates()
  const existing = states.get(pluginId) || { enabled: false }
  existing.config = config
  states.set(pluginId, existing)
  saveAllStates(states)
}

/**
 * 移除插件状态（完全清除）
 */
export function removePluginState(pluginId: string): void {
  const states = loadPluginStates()
  states.delete(pluginId)
  saveAllStates(states)
}

/**
 * 清除所有插件状态
 */
export function clearAllPluginStates(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('[PluginStorage] Failed to clear plugin states:', error)
  }
}

/**
 * 检查是否有存储的插件状态（用于判断是否首次加载）
 */
export function hasStoredStates(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return false
    const data = JSON.parse(stored)
    return Object.keys(data).length > 0
  } catch {
    return false
  }
}
