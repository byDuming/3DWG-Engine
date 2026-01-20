/**
 * 场景选择 Store
 * 
 * 职责：
 * - 当前选中的对象ID
 * - 多选支持
 * - 变换模式和空间
 * - 选择相关的计算属性
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useSceneCoreStore } from './useSceneCore.store'
import type { SceneObjectData } from '@/interfaces/sceneInterface'

export const useSceneSelectionStore = defineStore('sceneSelection', () => {
  const coreStore = useSceneCoreStore()

  // ==================== 选择状态 ====================
  
  /** 当前选中的对象ID（单选） */
  const selectedObjectId = ref<string | null>(null)
  
  /** 选择版本号（用于触发重新渲染） */
  const selectionVersion = ref(0)
  
  /** 多选的对象ID集合 */
  const selectedObjectIds = ref<Set<string>>(new Set())
  
  /** 是否启用多选模式 */
  const multiSelectEnabled = ref(false)

  // ==================== 变换控制 ====================
  
  /** 变换模式：平移、旋转、缩放 */
  const transformMode = ref<'translate' | 'rotate' | 'scale'>('translate')
  
  /** 变换空间：世界坐标 或 本地坐标 */
  const transformSpace = ref<'world' | 'local'>('world')

  // ==================== 计算属性 ====================
  
  /** 当前选中的对象数据 */
  const selectedObjectData = computed((): SceneObjectData | null => {
    if (!selectedObjectId.value) return null
    return coreStore.getObjectById(selectedObjectId.value) ?? null
  })
  
  /** 是否有选中的对象 */
  const hasSelection = computed(() => selectedObjectId.value !== null)
  
  /** 选中对象的类型 */
  const selectedObjectType = computed(() => selectedObjectData.value?.type ?? null)
  
  /** 多选的对象数据列表 */
  const selectedObjectsData = computed((): SceneObjectData[] => {
    if (!multiSelectEnabled.value || selectedObjectIds.value.size === 0) {
      return selectedObjectData.value ? [selectedObjectData.value] : []
    }
    
    return Array.from(selectedObjectIds.value)
      .map(id => coreStore.getObjectById(id))
      .filter((obj): obj is SceneObjectData => obj !== undefined)
  })
  
  /** 选中的对象数量 */
  const selectionCount = computed(() => {
    if (multiSelectEnabled.value) {
      return selectedObjectIds.value.size
    }
    return selectedObjectId.value ? 1 : 0
  })

  // ==================== 选择操作 ====================
  
  /**
   * 选择单个对象
   */
  function select(id: string | null) {
    // 检查对象是否存在且可选
    if (id) {
      const obj = coreStore.getObjectById(id)
      if (!obj || obj.selectable === false) {
        return
      }
    }
    
    selectedObjectId.value = id
    selectionVersion.value++
    
    // 如果不是多选模式，清空多选集合
    if (!multiSelectEnabled.value) {
      selectedObjectIds.value.clear()
      if (id) {
        selectedObjectIds.value.add(id)
      }
    }
  }
  
  /**
   * 添加到选择（多选）
   */
  function addToSelection(id: string) {
    const obj = coreStore.getObjectById(id)
    if (!obj || obj.selectable === false) {
      return
    }
    
    selectedObjectIds.value.add(id)
    
    // 如果是第一个选中的，也设为主选中
    if (!selectedObjectId.value) {
      selectedObjectId.value = id
    }
    
    selectionVersion.value++
  }
  
  /**
   * 从选择中移除
   */
  function removeFromSelection(id: string) {
    selectedObjectIds.value.delete(id)
    
    // 如果移除的是主选中对象，切换到下一个
    if (selectedObjectId.value === id) {
      const remaining = Array.from(selectedObjectIds.value)
      selectedObjectId.value = remaining[0] ?? null
    }
    
    selectionVersion.value++
  }
  
  /**
   * 切换选择状态
   */
  function toggleSelection(id: string) {
    if (selectedObjectIds.value.has(id)) {
      removeFromSelection(id)
    } else {
      addToSelection(id)
    }
  }
  
  /**
   * 选择多个对象
   */
  function selectMultiple(ids: string[]) {
    selectedObjectIds.value.clear()
    
    for (const id of ids) {
      const obj = coreStore.getObjectById(id)
      if (obj && obj.selectable !== false) {
        selectedObjectIds.value.add(id)
      }
    }
    
    selectedObjectId.value = ids[0] ?? null
    selectionVersion.value++
  }
  
  /**
   * 清空选择
   */
  function clearSelection() {
    selectedObjectId.value = null
    selectedObjectIds.value.clear()
    selectionVersion.value++
  }
  
  /**
   * 选择全部（可见对象）
   */
  function selectAll() {
    const selectableObjects = coreStore.objectDataList
      .filter(obj => obj.selectable !== false && obj.visible !== false)
    
    selectMultiple(selectableObjects.map(obj => obj.id))
  }
  
  /**
   * 反选
   */
  function invertSelection() {
    const currentIds = new Set(selectedObjectIds.value)
    const newIds = coreStore.objectDataList
      .filter(obj => obj.selectable !== false && !currentIds.has(obj.id))
      .map(obj => obj.id)
    
    selectMultiple(newIds)
  }

  // ==================== 变换模式操作 ====================
  
  /**
   * 设置变换模式
   */
  function setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
    transformMode.value = mode
  }
  
  /**
   * 切换变换模式
   */
  function cycleTransformMode() {
    const modes: Array<'translate' | 'rotate' | 'scale'> = ['translate', 'rotate', 'scale']
    const currentIndex = modes.indexOf(transformMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    transformMode.value = modes[nextIndex] ?? 'translate'
  }
  
  /**
   * 设置变换空间
   */
  function setTransformSpace(space: 'world' | 'local') {
    transformSpace.value = space
  }
  
  /**
   * 切换变换空间
   */
  function toggleTransformSpace() {
    transformSpace.value = transformSpace.value === 'world' ? 'local' : 'world'
  }

  // ==================== 选择辅助 ====================
  
  /**
   * 选择父对象
   */
  function selectParent() {
    if (!selectedObjectData.value?.parentId) return
    select(selectedObjectData.value.parentId)
  }
  
  /**
   * 选择第一个子对象
   */
  function selectFirstChild() {
    if (!selectedObjectId.value) return
    const children = coreStore.getChildren(selectedObjectId.value)
    if (children.length > 0 && children[0]) {
      select(children[0].id)
    }
  }
  
  /**
   * 选择同级下一个对象
   */
  function selectNextSibling() {
    if (!selectedObjectData.value) return
    
    const parentId = selectedObjectData.value.parentId
    const siblings = parentId 
      ? coreStore.getChildren(parentId)
      : coreStore.getRootObjects()
    
    const currentIndex = siblings.findIndex(obj => obj.id === selectedObjectId.value)
    const nextSibling = siblings[currentIndex + 1]
    if (currentIndex >= 0 && currentIndex < siblings.length - 1 && nextSibling) {
      select(nextSibling.id)
    }
  }
  
  /**
   * 选择同级上一个对象
   */
  function selectPrevSibling() {
    if (!selectedObjectData.value) return
    
    const parentId = selectedObjectData.value.parentId
    const siblings = parentId 
      ? coreStore.getChildren(parentId)
      : coreStore.getRootObjects()
    
    const currentIndex = siblings.findIndex(obj => obj.id === selectedObjectId.value)
    const prevSibling = siblings[currentIndex - 1]
    if (currentIndex > 0 && prevSibling) {
      select(prevSibling.id)
    }
  }

  // ==================== 监听器 ====================
  
  // 当对象被删除时，自动清除选择
  watch(
    () => coreStore.objectDataList.length,
    () => {
      if (selectedObjectId.value && !coreStore.getObjectById(selectedObjectId.value)) {
        select(null)
      }
      
      // 清理多选中已删除的对象
      for (const id of selectedObjectIds.value) {
        if (!coreStore.getObjectById(id)) {
          selectedObjectIds.value.delete(id)
        }
      }
    }
  )

  // ==================== 返回 ====================
  
  return {
    // 选择状态
    selectedObjectId,
    selectionVersion,
    selectedObjectIds,
    multiSelectEnabled,
    
    // 变换控制
    transformMode,
    transformSpace,
    
    // 计算属性
    selectedObjectData,
    hasSelection,
    selectedObjectType,
    selectedObjectsData,
    selectionCount,
    
    // 选择操作
    select,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    selectMultiple,
    clearSelection,
    selectAll,
    invertSelection,
    
    // 变换模式
    setTransformMode,
    cycleTransformMode,
    setTransformSpace,
    toggleTransformSpace,
    
    // 选择辅助
    selectParent,
    selectFirstChild,
    selectNextSibling,
    selectPrevSibling
  }
})
