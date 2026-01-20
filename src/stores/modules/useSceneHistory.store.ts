/**
 * 场景历史 Store
 * 
 * 职责：
 * - 撤销/重做功能
 * - 命令模式历史管理
 * - 批量操作分组
 * 
 * 基于 commandPattern.ts 中的 HistoryManager
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSceneCoreStore } from './useSceneCore.store'
import { useSceneSelectionStore } from './useSceneSelection.store'
import {
  HistoryManager,
  AddObjectCommand,
  RemoveObjectCommand,
  UpdateTransformCommand,
  UpdateObjectCommand
} from '@/utils/commandPattern'
import type { SceneObjectData } from '@/interfaces/sceneInterface'

export const useSceneHistoryStore = defineStore('sceneHistory', () => {
  const coreStore = useSceneCoreStore()
  const selectionStore = useSceneSelectionStore()

  // ==================== 历史管理器 ====================
  
  /** 命令模式历史管理器 */
  const historyManager = new HistoryManager()
  
  /** 响应式版本号（用于触发UI更新） */
  const historyVersion = ref(0)
  
  /** 是否正在恢复历史（防止递归记录） */
  const isRestoring = ref(false)
  
  /** 是否使用命令模式（可以切换到旧的快照模式） */
  const useCommandPattern = ref(true)

  // ==================== 计算属性 ====================
  
  /** 是否可以撤销 */
  const canUndo = computed(() => historyManager.canUndo())
  
  /** 是否可以重做 */
  const canRedo = computed(() => historyManager.canRedo())
  
  /** 撤销历史数量 */
  const undoCount = computed(() => historyManager.getHistoryCount().undo)
  
  /** 重做历史数量 */
  const redoCount = computed(() => historyManager.getHistoryCount().redo)
  
  /** 撤销历史列表 */
  const undoHistory = computed(() => historyManager.getUndoHistory())
  
  /** 重做历史列表 */
  const redoHistory = computed(() => historyManager.getRedoHistory())

  // ==================== 核心操作（带历史记录） ====================
  
  /**
   * 添加对象（带历史记录）
   */
  function addObject(data: SceneObjectData): SceneObjectData {
    const cmd = new AddObjectCommand(
      () => ({ 
        addSceneObjectData: (d: SceneObjectData) => coreStore._addObjectData(d),
        removeSceneObjectData: (id: string) => coreStore._removeObjectData(id)
      } as any),
      data
    )
    
    cmd.execute()
    historyManager.pushCommand(cmd)
    historyVersion.value++
    
    return data
  }
  
  /**
   * 更新对象（带历史记录）
   */
  function updateObject(id: string, patch: Partial<SceneObjectData>): boolean {
    const currentData = coreStore.getObjectById(id)
    if (!currentData) return false
    
    // 保存更新前的数据
    const initialData: Partial<SceneObjectData> = {}
    for (const key of Object.keys(patch) as Array<keyof SceneObjectData>) {
      (initialData as any)[key] = (currentData as any)[key]
    }
    
    const cmd = new UpdateObjectCommand(
      () => ({
        objectDataList: coreStore.objectDataList,
        updateSceneObjectData: (objId: string, p: Partial<SceneObjectData>) => coreStore._updateObjectData(objId, p)
      } as any),
      id,
      patch,
      initialData
    )
    
    cmd.execute()
    historyManager.pushCommand(cmd)
    historyVersion.value++
    
    return true
  }
  
  /**
   * 更新变换（带历史记录，支持合并）
   */
  function updateTransform(
    id: string, 
    transform: SceneObjectData['transform'],
    initialTransform?: SceneObjectData['transform']
  ): boolean {
    const cmd = new UpdateTransformCommand(
      () => ({
        objectDataList: coreStore.objectDataList,
        updateSceneObjectData: (objId: string, p: Partial<SceneObjectData>) => coreStore._updateObjectData(objId, p)
      } as any),
      id,
      transform,
      initialTransform
    )
    
    cmd.execute()
    historyManager.pushCommand(cmd)
    historyVersion.value++
    
    return true
  }
  
  /**
   * 删除对象（带历史记录）
   */
  function removeObject(id: string): SceneObjectData | null {
    const cmd = new RemoveObjectCommand(
      () => ({
        objectDataList: coreStore.objectDataList,
        addSceneObjectData: (d: SceneObjectData) => coreStore._addObjectData(d),
        removeSceneObjectData: (objId: string) => coreStore._removeObjectData(objId)
      } as any),
      id
    )
    
    cmd.execute()
    historyManager.pushCommand(cmd)
    historyVersion.value++
    
    // 如果删除的是选中对象，清除选择
    if (selectionStore.selectedObjectId === id) {
      selectionStore.clearSelection()
    }
    
    return null
  }

  // ==================== 撤销/重做 ====================
  
  /**
   * 撤销
   */
  function undo(): boolean {
    if (!canUndo.value || isRestoring.value) return false
    
    isRestoring.value = true
    try {
      const success = historyManager.undo()
      if (success) {
        historyVersion.value++
      }
      return success
    } finally {
      isRestoring.value = false
    }
  }
  
  /**
   * 重做
   */
  function redo(): boolean {
    if (!canRedo.value || isRestoring.value) return false
    
    isRestoring.value = true
    try {
      const success = historyManager.redo()
      if (success) {
        historyVersion.value++
      }
      return success
    } finally {
      isRestoring.value = false
    }
  }

  // ==================== 批量操作 ====================
  
  /**
   * 开始操作分组
   */
  function beginGroup(description?: string) {
    historyManager.beginGroup(description)
  }
  
  /**
   * 结束操作分组
   */
  function endGroup() {
    historyManager.endGroup()
    historyVersion.value++
  }
  
  /**
   * 执行分组操作（自动开始和结束分组）
   */
  function withGroup<T>(description: string, fn: () => T): T {
    beginGroup(description)
    try {
      return fn()
    } finally {
      endGroup()
    }
  }

  // ==================== 历史管理 ====================
  
  /**
   * 清空历史
   */
  function clearHistory() {
    historyManager.clear()
    historyVersion.value++
  }
  
  /**
   * 标记当前状态为"干净"（用于判断是否有未保存的更改）
   */
  const savedHistoryVersion = ref(0)
  
  function markAsSaved() {
    savedHistoryVersion.value = historyVersion.value
  }
  
  /** 是否有未保存的更改 */
  const hasUnsavedChanges = computed(() => {
    return historyVersion.value !== savedHistoryVersion.value
  })

  // ==================== 返回 ====================
  
  return {
    // 历史管理器
    historyManager,
    historyVersion,
    isRestoring,
    useCommandPattern,
    
    // 计算属性
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    undoHistory,
    redoHistory,
    hasUnsavedChanges,
    
    // 核心操作
    addObject,
    updateObject,
    updateTransform,
    removeObject,
    
    // 撤销/重做
    undo,
    redo,
    
    // 批量操作
    beginGroup,
    endGroup,
    withGroup,
    
    // 历史管理
    clearHistory,
    markAsSaved
  }
})
