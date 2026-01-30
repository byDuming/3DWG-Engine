/**
 * 场景加载状态 Store
 * 
 * 职责：
 * - 管理场景加载过程中的资源追踪
 * - 提供详细的加载进度信息
 * - 支持模型、贴图、HDR、立方体贴图等资源类型
 */

import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'

/** 资源类型 */
export type ResourceType = 'model' | 'texture' | 'hdr' | 'cubemap' | 'pointcloud'

/** 加载状态 */
export type LoadingStatus = 'pending' | 'loading' | 'loaded' | 'error'

/** 加载资源信息 */
export interface LoadingResource {
  id: string
  name: string
  type: ResourceType
  status: LoadingStatus
  progress: number      // 0-100
  size?: number         // 文件大小（字节）
  loaded?: number       // 已加载字节
  error?: string        // 错误信息
  startTime?: number    // 开始加载时间
  endTime?: number      // 完成加载时间
}

/** 资源类型配置 */
const resourceTypeConfig: Record<ResourceType, { label: string; color: string }> = {
  model: { label: '模型', color: '#18a058' },
  texture: { label: '贴图', color: '#2080f0' },
  hdr: { label: 'HDR', color: '#f0a020' },
  cubemap: { label: '立方体贴图', color: '#a855f7' },
  pointcloud: { label: '点云', color: '#06b6d4' }
}

export const useLoadingStore = defineStore('loading', () => {
  
  // ==================== 状态 ====================
  
  /** 是否正在加载 */
  const isLoading = ref(false)
  
  /** 加载阶段描述 */
  const loadingPhase = ref<string>('准备中...')
  
  /** 场景数据获取状态 */
  const sceneDataStatus = ref<'pending' | 'loading' | 'loaded' | 'error'>('pending')
  
  /** 资源映射表 */
  const resources = shallowRef(new Map<string, LoadingResource>())
  
  /** 当前正在加载的资源ID */
  const currentResourceId = ref<string | null>(null)
  
  /** 加载开始时间 */
  const loadStartTime = ref<number>(0)
  
  /** 是否处于初始化加载模式（区分运行时编辑） */
  const isInitialLoading = ref(false)

  // ==================== 计算属性 ====================
  
  /** 资源列表（按状态排序：加载中 > 等待 > 完成 > 错误） */
  const resourceList = computed(() => {
    const list = Array.from(resources.value.values())
    const statusOrder: Record<LoadingStatus, number> = {
      loading: 0,
      pending: 1,
      loaded: 2,
      error: 3
    }
    return list.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  })
  
  /** 总资源数 */
  const totalCount = computed(() => resources.value.size)
  
  /** 已加载资源数 */
  const loadedCount = computed(() => {
    let count = 0
    resources.value.forEach(r => {
      if (r.status === 'loaded') count++
    })
    return count
  })
  
  /** 加载失败资源数 */
  const errorCount = computed(() => {
    let count = 0
    resources.value.forEach(r => {
      if (r.status === 'error') count++
    })
    return count
  })
  
  /** 正在加载的资源数 */
  const loadingCount = computed(() => {
    let count = 0
    resources.value.forEach(r => {
      if (r.status === 'loading') count++
    })
    return count
  })
  
  /** 总体加载进度 (0-100) */
  const totalProgress = computed(() => {
    if (resources.value.size === 0) return 0
    
    let totalProgress = 0
    resources.value.forEach(r => {
      // 已完成的算100%，错误的也算100%（不再等待）
      if (r.status === 'loaded' || r.status === 'error') {
        totalProgress += 100
      } else {
        totalProgress += r.progress
      }
    })
    
    return Math.round(totalProgress / resources.value.size)
  })
  
  /** 当前正在加载的资源 */
  const currentResource = computed(() => {
    if (!currentResourceId.value) return null
    return resources.value.get(currentResourceId.value) ?? null
  })
  
  /** 已加载的总字节数 */
  const totalLoadedBytes = computed(() => {
    let bytes = 0
    resources.value.forEach(r => {
      if (r.loaded) bytes += r.loaded
    })
    return bytes
  })
  
  /** 总文件大小（已知的） */
  const totalSizeBytes = computed(() => {
    let bytes = 0
    resources.value.forEach(r => {
      if (r.size) bytes += r.size
    })
    return bytes
  })
  
  /** 加载耗时（秒） */
  const elapsedTime = computed(() => {
    if (!loadStartTime.value) return 0
    return Math.round((Date.now() - loadStartTime.value) / 1000)
  })

  // ==================== 方法 ====================
  
  /**
   * 开始加载流程
   * @param isInitial 是否是初始化加载（显示loading页面）
   */
  function startLoading(isInitial = true) {
    isLoading.value = true
    isInitialLoading.value = isInitial
    loadingPhase.value = '正在加载场景...'
    loadStartTime.value = Date.now()
    resources.value = new Map()
    currentResourceId.value = null
    sceneDataStatus.value = 'pending'
  }
  
  /**
   * 标记场景数据开始获取
   */
  function markSceneDataLoading() {
    sceneDataStatus.value = 'loading'
  }
  
  /**
   * 标记场景数据获取完成
   */
  function markSceneDataLoaded() {
    sceneDataStatus.value = 'loaded'
  }
  
  /**
   * 标记场景数据获取失败
   */
  function markSceneDataError() {
    sceneDataStatus.value = 'error'
  }
  
  /**
   * 注册待加载资源
   * @param id 资源唯一ID
   * @param name 资源显示名称
   * @param type 资源类型
   */
  function registerResource(id: string, name: string, type: ResourceType) {
    const newMap = new Map(resources.value)
    newMap.set(id, {
      id,
      name,
      type,
      status: 'pending',
      progress: 0
    })
    resources.value = newMap
  }
  
  /**
   * 批量注册资源
   */
  function registerResources(items: Array<{ id: string; name: string; type: ResourceType }>) {
    const newMap = new Map(resources.value)
    for (const item of items) {
      newMap.set(item.id, {
        id: item.id,
        name: item.name,
        type: item.type,
        status: 'pending',
        progress: 0
      })
    }
    resources.value = newMap
  }
  
  /**
   * 标记资源开始加载
   */
  function markResourceLoading(id: string) {
    const resource = resources.value.get(id)
    if (resource) {
      const newMap = new Map(resources.value)
      newMap.set(id, {
        ...resource,
        status: 'loading',
        startTime: Date.now()
      })
      resources.value = newMap
      currentResourceId.value = id
    }
  }
  
  /**
   * 更新资源加载进度
   * @param id 资源ID
   * @param progress 进度 0-100
   * @param loaded 已加载字节（可选）
   * @param total 总字节（可选）
   */
  function updateProgress(id: string, progress: number, loaded?: number, total?: number) {
    const resource = resources.value.get(id)
    if (resource) {
      const newMap = new Map(resources.value)
      newMap.set(id, {
        ...resource,
        status: 'loading',
        progress: Math.min(100, Math.max(0, progress)),
        loaded: loaded ?? resource.loaded,
        size: total ?? resource.size
      })
      resources.value = newMap
      currentResourceId.value = id
    }
  }
  
  /**
   * 标记资源加载完成
   */
  function markLoaded(id: string) {
    const resource = resources.value.get(id)
    if (resource) {
      const newMap = new Map(resources.value)
      newMap.set(id, {
        ...resource,
        status: 'loaded',
        progress: 100,
        endTime: Date.now()
      })
      resources.value = newMap
      
      // 如果当前资源是这个，清除
      if (currentResourceId.value === id) {
        // 找下一个正在加载的
        const loading = Array.from(newMap.values()).find(r => r.status === 'loading')
        currentResourceId.value = loading?.id ?? null
      }
    }
  }
  
  /**
   * 标记资源加载失败
   */
  function markError(id: string, error?: string) {
    const resource = resources.value.get(id)
    if (resource) {
      const newMap = new Map(resources.value)
      newMap.set(id, {
        ...resource,
        status: 'error',
        error: error ?? '加载失败',
        endTime: Date.now()
      })
      resources.value = newMap
      
      if (currentResourceId.value === id) {
        const loading = Array.from(newMap.values()).find(r => r.status === 'loading')
        currentResourceId.value = loading?.id ?? null
      }
    }
  }
  
  /**
   * 设置加载阶段描述
   */
  function setPhase(phase: string) {
    loadingPhase.value = phase
  }
  
  /**
   * 完成加载流程
   * @param delay 延迟关闭时间（毫秒），用于显示完成动画
   */
  function finishLoading(delay = 500) {
    loadingPhase.value = '加载完成'
    
    setTimeout(() => {
      isLoading.value = false
      isInitialLoading.value = false
      currentResourceId.value = null
    }, delay)
  }
  
  /**
   * 强制关闭加载页面
   */
  function forceClose() {
    isLoading.value = false
    isInitialLoading.value = false
    resources.value = new Map()
    currentResourceId.value = null
  }
  
  /**
   * 检查是否有资源需要加载
   */
  function hasResources(): boolean {
    return resources.value.size > 0
  }
  
  /**
   * 检查所有资源是否都已完成（成功或失败）
   */
  function isAllCompleted(): boolean {
    if (resources.value.size === 0) return true
    
    for (const r of resources.value.values()) {
      if (r.status !== 'loaded' && r.status !== 'error') {
        return false
      }
    }
    return true
  }
  
  /**
   * 获取资源类型配置
   */
  function getTypeConfig(type: ResourceType) {
    return resourceTypeConfig[type]
  }
  
  /**
   * 格式化文件大小
   */
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ==================== 返回 ====================
  
  return {
    // 状态
    isLoading,
    isInitialLoading,
    loadingPhase,
    sceneDataStatus,
    resources,
    currentResourceId,
    loadStartTime,
    
    // 计算属性
    resourceList,
    totalCount,
    loadedCount,
    errorCount,
    loadingCount,
    totalProgress,
    currentResource,
    totalLoadedBytes,
    totalSizeBytes,
    elapsedTime,
    
    // 方法
    startLoading,
    registerResource,
    registerResources,
    markResourceLoading,
    updateProgress,
    markLoaded,
    markError,
    setPhase,
    finishLoading,
    forceClose,
    hasResources,
    isAllCompleted,
    getTypeConfig,
    formatSize,
    markSceneDataLoading,
    markSceneDataLoaded,
    markSceneDataError
  }
})
