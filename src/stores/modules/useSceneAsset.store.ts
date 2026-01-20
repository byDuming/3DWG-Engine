/**
 * 场景资产 Store
 * 
 * 职责：
 * - 资产列表管理（纹理、模型、HDR等）
 * - 本地文件缓存
 * - 资产上传和解析
 */

import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { AssetRef } from '@/types/asset'
import { assetApi } from '@/services/assetApi'

export const useSceneAssetStore = defineStore('sceneAsset', () => {

  // ==================== 资产数据 ====================
  
  /** 资产引用列表 */
  const assets = ref<AssetRef[]>([])
  
  /** 本地文件缓存 (id -> File) */
  const assetFiles = shallowRef(new Map<string, File>())
  
  /** 资产加载状态 */
  const loadingAssets = ref<Set<string>>(new Set())

  // ==================== 计算属性 ====================
  
  /** 资产数量 */
  const assetCount = computed(() => assets.value.length)
  
  /** 按类型分组的资产 */
  const assetsByType = computed(() => {
    const groups: Record<string, AssetRef[]> = {}
    for (const asset of assets.value) {
      const type = asset.type
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type]!.push(asset)
    }
    return groups
  })
  
  /** 纹理资产 */
  const textureAssets = computed(() => 
    assets.value.filter(a => a.type === 'texture')
  )
  
  /** 模型资产 */
  const modelAssets = computed(() => 
    assets.value.filter(a => a.type === 'model')
  )
  
  /** HDR资产 */
  const hdrAssets = computed(() => 
    assets.value.filter(a => a.type === 'hdri')
  )

  // ==================== 查询方法 ====================
  
  /**
   * 根据ID获取资产
   */
  function getAssetById(id: string): AssetRef | undefined {
    return assets.value.find(a => a.id === id)
  }
  
  /**
   * 根据名称获取资产
   */
  function getAssetByName(name: string): AssetRef | undefined {
    return assets.value.find(a => a.name === name)
  }
  
  /**
   * 检查资产是否存在
   */
  function hasAsset(id: string): boolean {
    return assets.value.some(a => a.id === id)
  }
  
  /**
   * 检查资产是否正在加载
   */
  function isAssetLoading(id: string): boolean {
    return loadingAssets.value.has(id)
  }

  // ==================== 本地资产操作 ====================
  
  /**
   * 注册本地资产（从文件）
   */
  function registerLocalAsset(
    file: File, 
    type: AssetRef['type'] = 'texture'
  ): AssetRef {
    const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const uri = URL.createObjectURL(file)
    
    const asset: AssetRef = {
      id,
      name: file.name,
      type,
      uri,
      source: 'local',
      size: file.size,
      mimeType: file.type,
      createdAt: Date.now()
    }
    
    assets.value.push(asset)
    
    // 缓存文件
    const newFiles = new Map(assetFiles.value)
    newFiles.set(id, file)
    assetFiles.value = newFiles
    
    return asset
  }
  
  /**
   * 注册远程资产（URL）
   */
  function registerRemoteAsset(
    url: string,
    name: string,
    type: AssetRef['type'] = 'texture'
  ): AssetRef {
    const id = `remote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const asset: AssetRef = {
      id,
      name,
      type,
      uri: url,
      source: 'remote',
      createdAt: Date.now()
    }
    
    assets.value.push(asset)
    
    return asset
  }
  
  /**
   * 解析资产URI（处理本地文件和远程URL）
   */
  async function resolveAssetUri(
    asset: AssetRef
  ): Promise<{ url: string; revoke?: () => void } | null> {
    if (!asset) return null
    
    // 远程资产直接返回URI
    if (asset.source === 'remote' || asset.uri.startsWith('http')) {
      return { url: asset.uri }
    }
    
    // 本地资产：检查是否有缓存文件
    const file = assetFiles.value.get(asset.id)
    if (file) {
      const url = URL.createObjectURL(file)
      return { 
        url, 
        revoke: () => URL.revokeObjectURL(url) 
      }
    }
    
    // 已经是 Blob URL
    if (asset.uri.startsWith('blob:')) {
      return { url: asset.uri }
    }
    
    return null
  }

  // ==================== 云端资产操作 ====================
  
  /**
   * 上传资产到云端
   */
  async function uploadAsset(asset: AssetRef): Promise<AssetRef | null> {
    const file = assetFiles.value.get(asset.id)
    if (!file) {
      console.warn('Cannot upload asset without file:', asset.id)
      return null
    }
    
    loadingAssets.value.add(asset.id)
    
    try {
      const uploaded = await assetApi.uploadAsset({ file, type: asset.type })
      
      if (uploaded) {
        // 更新本地资产引用
        const index = assets.value.findIndex(a => a.id === asset.id)
        if (index >= 0) {
          const existing = assets.value[index]
          if (existing) {
            assets.value[index] = {
              ...existing,
              uri: uploaded.publicUrl,
              source: 'cloud',
              cloudId: uploaded.asset.id
            }
          }
        }
        
        return assets.value[index] ?? null
      }
      
      return null
    } finally {
      loadingAssets.value.delete(asset.id)
    }
  }
  
  /**
   * 下载云端资产
   */
  async function downloadAsset(cloudId: string): Promise<AssetRef | null> {
    loadingAssets.value.add(cloudId)
    
    try {
      // 从全局资产列表中获取
      const allAssets = await assetApi.getGlobalAssets()
      const asset = allAssets.find(a => a.id === cloudId)
      
      if (asset) {
        // 检查是否已存在
        if (!hasAsset(asset.id)) {
          assets.value.push(asset)
        }
        return asset
      }
      
      return null
    } finally {
      loadingAssets.value.delete(cloudId)
    }
  }

  // ==================== 资产管理 ====================
  
  /**
   * 删除资产
   */
  function removeAsset(id: string): boolean {
    const index = assets.value.findIndex(a => a.id === id)
    if (index === -1) return false
    
    const asset = assets.value[index]
    if (!asset) return false
    
    // 撤销 Blob URL
    if (asset.uri.startsWith('blob:')) {
      URL.revokeObjectURL(asset.uri)
    }
    
    // 移除文件缓存
    if (assetFiles.value.has(id)) {
      const newFiles = new Map(assetFiles.value)
      newFiles.delete(id)
      assetFiles.value = newFiles
    }
    
    assets.value.splice(index, 1)
    
    return true
  }
  
  /**
   * 更新资产
   */
  function updateAsset(id: string, patch: Partial<AssetRef>): boolean {
    const index = assets.value.findIndex(a => a.id === id)
    if (index === -1) return false
    
    const existing = assets.value[index]
    if (!existing) return false
    
    assets.value[index] = { ...existing, ...patch }
    return true
  }
  
  /**
   * 清空所有资产
   */
  function clearAssets() {
    // 撤销所有 Blob URL
    for (const asset of assets.value) {
      if (asset.uri.startsWith('blob:')) {
        URL.revokeObjectURL(asset.uri)
      }
    }
    
    assets.value = []
    assetFiles.value = new Map()
    loadingAssets.value.clear()
  }
  
  /**
   * 设置资产列表（用于加载场景）
   */
  function setAssets(newAssets: AssetRef[]) {
    clearAssets()
    assets.value = newAssets
  }

  // ==================== 文件处理 ====================
  
  /**
   * 从文件列表导入资产
   */
  async function importFiles(
    files: FileList | File[],
    type?: AssetRef['type']
  ): Promise<AssetRef[]> {
    const result: AssetRef[] = []
    
    for (const file of files) {
      // 自动检测类型
      const detectedType = type ?? detectAssetType(file)
      const asset = registerLocalAsset(file, detectedType)
      result.push(asset)
    }
    
    return result
  }
  
  /**
   * 检测资产类型
   */
  function detectAssetType(file: File): AssetRef['type'] {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const mime = file.type.toLowerCase()
    
    // 图片
    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
      return 'texture'
    }
    
    // HDR
    if (['hdr', 'exr'].includes(ext)) {
      return 'hdri'
    }
    
    // 3D模型
    if (['glb', 'gltf', 'obj', 'fbx', 'dae', 'stl', '3ds'].includes(ext)) {
      return 'model'
    }
    
    // 音频
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return 'audio'
    }
    
    // 视频
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) {
      return 'video'
    }
    
    return 'other'
  }

  // ==================== 返回 ====================
  
  return {
    // 数据
    assets,
    assetFiles,
    loadingAssets,
    
    // 计算属性
    assetCount,
    assetsByType,
    textureAssets,
    modelAssets,
    hdrAssets,
    
    // 查询方法
    getAssetById,
    getAssetByName,
    hasAsset,
    isAssetLoading,
    
    // 本地资产操作
    registerLocalAsset,
    registerRemoteAsset,
    resolveAssetUri,
    
    // 云端资产操作
    uploadAsset,
    downloadAsset,
    
    // 资产管理
    removeAsset,
    updateAsset,
    clearAssets,
    setAssets,
    
    // 文件处理
    importFiles,
    detectAssetType
  }
})
