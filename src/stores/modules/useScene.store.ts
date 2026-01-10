  import type { SceneObjectData } from '@/interfaces/sceneInterface.ts'
  import { getDB, initDB } from '@/services/db'

  import { defineStore } from 'pinia'
  import { Object3D, Scene } from 'three/webgpu'
  import type { WebGPURenderer } from 'three/webgpu'
  import { computed, ref, shallowRef,h, type VNodeChild } from 'vue'
  import { createSceneObjectData, type SceneObjectInput } from '@/utils/sceneFactory.ts'
  import { applyTransform, createThreeObject, syncThreeObjectState, updateMeshGeometry, updateMeshMaterial } from '@/utils/threeObjectFactory.ts'
  import { NIcon, useNotification, type TreeOption } from 'naive-ui'
  import {Cube,LogoDropbox,CubeOutline,Camera} from '@vicons/ionicons5'
  import { LightbulbFilled,MovieCreationFilled } from '@vicons/material'
  import { Cubes } from '@vicons/fa'
  import { useRenderer } from '@/composables/useRenderer'
import type { NotificationApiInjection } from 'naive-ui/es/notification/src/NotificationProvider'

//  `defineStore()` 的返回值的命名是自由的
// 但最好能显得store 的名字，且以 `use` 开头，尾`Store` 结尾。
// (比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中Store 的唯一 ID。
export const useSceneStore = defineStore('scene', () => {
  const name = ref('sceneStore') // store 名称
  const version = ref(1) // store 版本
  const aIds = ref(1) // 场景内对象自增ID

  
  const notification = shallowRef<NotificationApiInjection>();


  // Threejs 对象映射（扁平化，快速查找）
  const objectsMap = shallowRef(new Map<string, Object3D>());
  // 引擎逻辑层级（独立维护）
  const objectDataList = ref<SceneObjectData[]>([]);
  // 当前选中对象ID
  const selectedObjectId = ref<string | null>(null);
  const selectionVersion = ref(0);
  // three Scene 引用（用于同步 three 层）
  const webGPURenderer = shallowRef<WebGPURenderer | null>(null);
  const threeScene = shallowRef<Scene | null>(null);

  // 当前选中对象数据（基于 tree，支持子级）
  const selectedObjectData = computed(() => {
    const id = selectedObjectId.value
    if (!id) return null
    const tree = getObjectTree()
    const dfs = (nodes: TreeOption[]): SceneObjectData | null => {
      for (const node of nodes) {
        const raw = (node as any).raw as SceneObjectData | undefined
        if (raw?.id === id) return raw
        if (node.children?.length) {
          const found = dfs(node.children)
          if (found) return found
        }
      }
      return null
    }
    return dfs(tree)
  })

  const cureentObjectData = computed(() => {
    const id = selectedObjectId.value
    if (!id) return null
    return objectDataList.value.find(item => item.id === id) || null
  })
  
  const transformMode = ref<'translate' | 'rotate' | 'scale'>('translate');
  const transformSpace = ref<'world' | 'local'>('world');

  async function initScene() {
    const { sceneData } = await initDB() // 初始化数据库并获取场景数据
    name.value = sceneData.name // store 名称
    version.value = sceneData.version // store 版本
    aIds.value = sceneData.aIds // 场景内对象自增ID
    objectDataList.value = sceneData.objectDataList ?? [] // 引擎逻辑层级

    // 数据准备好后，确保 three 场景和对象同步
    const scene = threeScene.value ?? new Scene()
    setThreeScene(scene)
  }

  // 获取树形结构（用于层级面板），返回 TreeOption[]
  function getObjectTree(): TreeOption[] {
    const tree: TreeOption[] = []
    const map = new Map<string, TreeOption & { raw: SceneObjectData; children: TreeOption[] }>()

    // 先创建所有节点的增强版本
    objectDataList.value.forEach(data => {
      // 自定义icon
      let prefix:() => VNodeChild = () => h(Cube);
      if(data.type === 'mesh'){
        prefix = () => h(Cube)
      } else if(data.type === 'group'){ 
        prefix = () => h(LogoDropbox)
      } else if(data.type === 'helper'){
        prefix = () => h(CubeOutline)
      } else if(data.type === 'light'){
        prefix = () => h(LightbulbFilled)
      } else if(data.type === 'camera'){
        prefix = () => h(Camera)
      } else if(data.type === 'model'){
        prefix = () => h(Cubes)
      }else if(data.type === 'scene'){
        prefix = () => h(MovieCreationFilled)
      }

      map.set(data.id, {
        key: data.id,
        label: data.name ?? data.id,
        raw: data,
        children: [],
        prefix: () => h(NIcon, null, {
          default: prefix
        })
      })

    })

    // 构建树
    objectDataList.value.forEach(data => {
      const node = map.get(data.id)!

      if (data.parentId === null || data.parentId === undefined) {
        tree.push(node)
      } else {
        const parent = map.get(data.parentId)
        if (parent) {
          parent.children.push(node)
        } else {
          tree.push(node) // 没找到父节点则挂到根
        }
      }
    })

    // 清理空 children，符合 TreeOption 结构
    // map.forEach(node => {
    //   if (!node.children.length) {
    //     delete (node as any).children
    //   }
    // })

    return tree
  }

  /**
   * 将层级面板的树形数据反写到 store，保持 objectDataList/three 场景同步
   */
  function applyObjectTree(tree: TreeOption[]) {
    const nextList: SceneObjectData[] = []
    const dfs = (nodes: TreeOption[], parentId?: string) => {
      nodes.forEach(node => {
        const raw = (node as any).raw as SceneObjectData | undefined
        if (!raw) return
        const children = node.children ?? []
        const childrenIds = children
          .map(child => ((child as any).raw as SceneObjectData | undefined)?.id)
          .filter((id): id is string => !!id)
        const updated: SceneObjectData = { ...raw, parentId, childrenIds }
        nextList.push(updated)
        if (children.length) dfs(children, raw.id)
      })
    }
    dfs(tree)
    objectDataList.value = nextList
    nextList.forEach(item => attachThreeObject(item))
  }

  function setThreeScene(scene: Scene | null) {
    threeScene.value = scene
    if (!scene) return

    // 确保每个数据节点都有对应的 three 对象并挂载
    const dataMap = new Map(objectDataList.value.map(item => [item.id, item]))

    dataMap.forEach(data => {
      let obj = objectsMap.value.get(data.id)
      if (!obj) {
        obj = createThreeObject(data, { objectsMap: objectsMap.value })
        objectsMap.value.set(data.id, obj)
      } else {
        applyTransform(obj, data)
      }
    })

    objectsMap.value.forEach((obj, id) => {
      const data = dataMap.get(id)
      if (!data) return
      if (obj.parent) obj.parent.remove(obj)
      const parent = data.parentId ? objectsMap.value.get(data.parentId) : threeScene.value
      parent?.add(obj)
    })
  }

  function setSelectedObject(id: string | null) {
    selectedObjectId.value = id
  }

  function addChildToParent(parentId: string, childId: string) {
    const parent = objectDataList.value.find(item => item.id === parentId)
    if (parent) {
      parent.childrenIds = [...new Set([...(parent.childrenIds ?? []), childId])]
    }
  }

  function removeChildFromParent(parentId: string, childId: string) {
    const parent = objectDataList.value.find(item => item.id === parentId)
    if (parent?.childrenIds) {
      parent.childrenIds = parent.childrenIds.filter(id => id !== childId)
    }
  }

  function attachThreeObject(data: SceneObjectData) {
    const obj = objectsMap.value.get(data.id)
    if (!obj) return
    if (obj.parent) obj.parent.remove(obj)

    const parent = data.parentId && data.parentId !== 'Scene' ? objectsMap.value.get(data.parentId) : threeScene.value
    parent?.add(obj)
  }

  // 新增场景对象（含 three 层同步）
  function addSceneObjectData(input: SceneObjectInput, options?: { addToThree?: boolean }) {
    const id = input.id ?? `obj-${aIds.value++}`;
    const newObj = createSceneObjectData({ ...input, id });
    objectDataList.value.push(newObj);
    

    if (newObj.parentId) {
      addChildToParent(newObj.parentId, id);
    }

    const addToThree = options?.addToThree ?? true
    if (addToThree) {
      const obj3d = createThreeObject(newObj, { objectsMap: objectsMap.value });
      objectsMap.value.set(id, obj3d);
      attachThreeObject(newObj);// 挂载到 three 层
    }

    return newObj;
  }

  // 更新场景对象（含 three 层同步）
  function updateSceneObjectData(id: string, patch: Partial<SceneObjectData>) {
    const target = objectDataList.value.find(item => item.id === id) // 找到要更新的原始数据
    if (!target) return null // 如果不存在直接返回

    const prevParentId = target.parentId // 记录旧父节点用于后续判断
    const nextTransform = patch.transform ? { ...target.transform, ...patch.transform } : target.transform // 合并transform
    const nextData: SceneObjectData = { ...target, ...patch, transform: nextTransform } // 组装最新的完整数据

    const typeChanged = patch.type !== undefined && patch.type !== target.type // 判断类型是否变化
    const helperChanged = patch.helper !== undefined && target.type === 'helper'
    const meshChanged = patch.mesh !== undefined && target.type === 'mesh'
    let meshRebuilt = false
    if (typeChanged || helperChanged) { // 类型或helper配置变更需要重建three对象
      const old = objectsMap.value.get(id) // 取出现有three对象
      if (old?.parent) old.parent.remove(old) // 从场景移除旧对象
      const newObj = createThreeObject(nextData, { objectsMap: objectsMap.value }) // 用最新数据创建新对象
      objectsMap.value.set(id, newObj) // 写回映射
      meshRebuilt = true
    } else if (meshChanged) {
      const obj = objectsMap.value.get(id)
      if (obj && (obj as any).isMesh) {
        if (patch.mesh?.geometry) updateMeshGeometry(obj as any, patch.mesh.geometry)
        if (patch.mesh?.material) updateMeshMaterial(obj as any, patch.mesh.material)
      } else {
        const old = objectsMap.value.get(id)
        if (old?.parent) old.parent.remove(old)
        const newObj = createThreeObject(nextData, { objectsMap: objectsMap.value })
        objectsMap.value.set(id, newObj)
        meshRebuilt = true
      }
    }

    Object.assign(target, { ...patch, transform: nextTransform }) // 覆盖store中的数据

    const obj = objectsMap.value.get(id) // 获取对应three对象
    if (obj) syncThreeObjectState(obj, nextData) // 同步位姿和渲染状态到three对象

    const parentChanged = patch.parentId !== undefined && patch.parentId !== prevParentId // 判断父节点是否变化
    if (parentChanged) { // 父节点变了需要更新关系和挂载
      if (prevParentId) removeChildFromParent(prevParentId, id) // 从旧父节点移除引用
      if (patch.parentId) addChildToParent(patch.parentId, id) // 添加到新父节点引用
    }

    if (typeChanged || helperChanged || parentChanged || meshRebuilt) attachThreeObject(nextData) // 若类型、helper配置或父节点变动，重新挂载three对象

    if ((typeChanged || helperChanged || meshChanged || parentChanged) && selectedObjectId.value === id) {
      selectionVersion.value += 1
    }

    return target // 返回更新后的数据
  }

  // 删除场景对象（默认递归删除子级，同时清理 three 层）
  function removeSceneObjectData(id: string, options?: { removeChildren?: boolean }) {
    const removeChildren = options?.removeChildren ?? true
    const idsToRemove = new Set<string>()

    const collect = (targetId: string) => {
      idsToRemove.add(targetId)
      if (!removeChildren) return
      objectDataList.value.forEach(item => {
        if (item.parentId === targetId) collect(item.id)
      })
    }

    collect(id)

    const target = objectDataList.value.find(item => item.id === id)
    if (target?.parentId) {
      removeChildFromParent(target.parentId, id)
    }

    if (!removeChildren) {
      objectDataList.value.forEach(item => {
        if (item.parentId === id) item.parentId = undefined
      })
    }

    idsToRemove.forEach(removeId => {
      const obj = objectsMap.value.get(removeId)
      if (obj?.parent) obj.parent.remove(obj)
      objectsMap.value.delete(removeId)
    })

    objectDataList.value = objectDataList.value.filter(item => !idsToRemove.has(item.id))

    if (selectedObjectId.value && idsToRemove.has(selectedObjectId.value)) {
      selectedObjectId.value = null
    }
  }

  function disposeMaterial(material: any, disposedMaterials: Set<unknown>, disposedTextures: Set<unknown>) {
    if (!material || disposedMaterials.has(material)) return
    const textureKeys = [
      'map',
      'lightMap',
      'aoMap',
      'emissiveMap',
      'bumpMap',
      'normalMap',
      'displacementMap',
      'roughnessMap',
      'metalnessMap',
      'alphaMap',
      'envMap',
      'specularMap',
      'gradientMap',
      'matcap'
    ]
    textureKeys.forEach(key => {
      const texture = material[key]
      if (texture && typeof texture.dispose === 'function' && !disposedTextures.has(texture)) {
        texture.dispose()
        disposedTextures.add(texture)
      }
    })
    if (typeof material.dispose === 'function') {
      material.dispose()
    }
    disposedMaterials.add(material)
  }

  function disposeObject(obj: Object3D, seen: Set<Object3D>, disposedGeometries: Set<unknown>, disposedMaterials: Set<unknown>, disposedTextures: Set<unknown>) {
    if (seen.has(obj)) return
    seen.add(obj)

    obj.children.slice().forEach(child => disposeObject(child, seen, disposedGeometries, disposedMaterials, disposedTextures))

    const anyObj = obj as any
    if (anyObj.geometry && typeof anyObj.geometry.dispose === 'function' && !disposedGeometries.has(anyObj.geometry)) {
      anyObj.geometry.dispose()
      disposedGeometries.add(anyObj.geometry)
    }
    if (anyObj.material) {
      if (Array.isArray(anyObj.material)) {
        anyObj.material.forEach((mat: any) => disposeMaterial(mat, disposedMaterials, disposedTextures))
      } else {
        disposeMaterial(anyObj.material, disposedMaterials, disposedTextures)
      }
    }
    const disposeFn = (anyObj as any).dispose
    if (typeof disposeFn === 'function') {
      disposeFn.call(anyObj)
    }
    if (obj.parent) {
      obj.parent.remove(obj)
    }
  }

  function clearScene() {
    useRenderer().stop();
    // const seen = new Set<Object3D>()
    // const disposedGeometries = new Set<unknown>()
    // const disposedMaterials = new Set<unknown>()
    // const disposedTextures = new Set<unknown>()

    // objectsMap.value.forEach(obj => disposeObject(obj, seen, disposedGeometries, disposedMaterials, disposedTextures))
    // threeScene.value?.children.slice().forEach(child => disposeObject(child, seen, disposedGeometries, disposedMaterials, disposedTextures))

    objectsMap.value.clear()
    objectDataList.value = []
    selectedObjectId.value = null

    threeScene.value?.clear();
    webGPURenderer.value?.dispose();
    webGPURenderer.value?.domElement.remove();
    webGPURenderer.value = null;
    threeScene.value = null
  }

  async function saveScene() {
    const db = getDB() // 获取数据库实例
    // await db.update_by_primaryKey({
    //   tableName: 'sceneData',
    //   value: 1,
    //   handle: r => {
    //     r.name = '测试修改';
    //     return r;
    //   }
    // })
    await db.update_by_primaryKey({
      tableName: 'sceneData', // 目标表
      value: 1, // 主键id
      handle: (row: any) => { // 返回更新后的记录
        row.id = row.id ?? 1
        row.name = name.value
        row.version = version.value
        row.aIds = aIds.value
        row.objectDataList = JSON.stringify(objectDataList.value)
        row.updatedAt = new Date()
        return row
      }
    })
    
    notification.value!!.success({
      content: '保存成功！',
      // meta: '想不出来',
      duration: 2500,
      keepAliveOnHover: true
    })
  }

  return {
    initScene,
    name,
    version,
    aIds,
    objectsMap,
    objectDataList,
    // 当前选中对象ID
    selectedObjectId,
    selectionVersion,
    selectedObjectData,
    cureentObjectData,
    setSelectedObject,
    setThreeScene,
    addSceneObjectData,
    updateSceneObjectData,
    removeSceneObjectData,
    // 获取树形结构
    getObjectTree,
    applyObjectTree,

    threeScene,
    webGPURenderer,

    clearScene,
    saveScene,
    
    transformMode,
    transformSpace,

    notification
  }
})
