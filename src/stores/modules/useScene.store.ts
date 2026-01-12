  import type { SceneObjectData } from '@/interfaces/sceneInterface.ts'
  import { getDB, initDB } from '@/services/db'

  import { defineStore } from 'pinia'
  import { Object3D, Scene } from 'three'
  import type { WebGPURenderer } from 'three/webgpu'
  import type { WebGLRenderer } from 'three'
import { computed, ref, shallowRef, h, type VNodeChild, toRaw, watch } from 'vue'
  import { createSceneObjectData, type SceneObjectInput } from '@/utils/sceneFactory.ts'
import { applyCameraSettings, applyLightSettings, applySceneSettings, applyTransform, createThreeObject, syncThreeObjectState, updateMeshGeometry, updateMeshMaterial } from '@/utils/threeObjectFactory.ts'
  import { NIcon, type TreeOption } from 'naive-ui'
  import {Cube,LogoDropbox,CubeOutline,Camera} from '@vicons/ionicons5'
  import { LightbulbFilled,MovieCreationFilled } from '@vicons/material'
  import { Cubes } from '@vicons/fa'
  import { useRenderer } from '@/composables/useRenderer'
  import type { NotificationApiInjection } from 'naive-ui/es/notification/src/NotificationProvider'
  import type { DialogApiInjection } from 'naive-ui/es/dialog/src/DialogProvider'
  import type { AssetRef } from '@/types/asset'
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

//  `defineStore()` 的返回值的命名是自由的
// 但最好能显得store 的名字，且以 `use` 开头，尾`Store` 结尾。
// (比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中Store 的唯一 ID。
export const useSceneStore = defineStore('scene', () => {
  const name = ref('sceneStore') // store 名称
  const version = ref(1) // store 版本
  const aIds = ref(1) // 场景内对象自增ID

  
  const notification = ref<NotificationApiInjection>();
  const dialogProvider = ref<DialogApiInjection>();


  // Threejs 对象映射（扁平化，快速查找）
  const objectsMap = shallowRef(new Map<string, Object3D>());
  // 引擎逻辑层级（独立维护）
  const objectDataList = ref<SceneObjectData[]>([]);
  // 当前选中对象ID
  const selectedObjectId = ref<string | null>(null);
  const selectionVersion = ref(0);
  // three Scene 引用（用于同步 three 层）
  const webGPURenderer = shallowRef<WebGPURenderer | WebGLRenderer | null>(null);
  const threeScene = shallowRef<Scene | null>(null);
  const rendererSettings = ref({
    rendererType: 'webgpu',
    antialias: true,
    shadows: true,
    shadowType: 'pcf',
    toneMapping: 'acesFilmic',
    toneMappingExposure: 1,
    outputColorSpace: 'srgb',
    useLegacyLights: false
  })
  const assets = ref<AssetRef[]>([])
  const assetFiles = shallowRef(new Map<string, File>())

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

  function getAssetById(id: string) {
    return assets.value.find(asset => asset.id === id) ?? null
  }

  function registerLocalAsset(file: File, type: AssetRef['type']): AssetRef {
    const id = `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const ext = file.name.split('.').pop()?.toLowerCase()
    const asset: AssetRef = {
      id,
      type,
      uri: `local://${id}`,
      name: file.name,
      source: 'local',
      meta: {
        ext,
        size: file.size,
        mime: file.type
      },
      createdAt: Date.now()
    }
    assets.value.push(asset)
    assetFiles.value.set(id, file)
    return asset
  }

  async function resolveAssetUri(asset: AssetRef) {
    if (asset.uri.startsWith('local://')) {
      const file = assetFiles.value.get(asset.id)
      if (!file) return null
      const url = URL.createObjectURL(file)
      return { url, revoke: () => URL.revokeObjectURL(url) }
    }
    return { url: asset.uri }
  }

  async function loadModelAssetIntoObject(assetId: string, objectId: string) {
    const asset = getAssetById(assetId)
    if (!asset) return
    const target = objectsMap.value.get(objectId)
    if (!target) return
    const resolved = await resolveAssetUri(asset)
    if (!resolved) {
      console.warn('Model asset is missing local file:', asset.name)
      return
    }
    const loader = new GLTFLoader()
    try {
      const gltf = await loader.loadAsync(resolved.url)
      target.children.slice().forEach(child => target.remove(child))
      if (gltf.scene) target.add(gltf.scene)
    } finally {
      resolved.revoke?.()
    }
  }

  async function importModelFile(file: File, parentId: string) {
    const asset = registerLocalAsset(file, 'model')
    const created = addSceneObjectData({
      type: 'model',
      name: asset.name,
      parentId,
      assetId: asset.id
    })
    await loadModelAssetIntoObject(asset.id, created.id)
    selectedObjectId.value = created.id
  }

  type SceneSnapshot = {
    objectDataList: SceneObjectData[]
    selectedObjectId: string | null
    aIds: number
  }

  const undoStack = ref<SceneSnapshot[]>([]) // 撤回栈：保存历史快照
  const redoStack = ref<SceneSnapshot[]>([]) // 回退栈：保存已撤回的快照
  const isRestoring = ref(false) // 快照恢复中，防止递归记录
  const maxHistory = 50 // 最多保留的快照数量
  const historyDebounceMs = ref(300) // 高频更新的去抖间隔
  const historyDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null) // 去抖计时器
  const lastSnapshot = shallowRef<SceneSnapshot | null>(null) // 上一次用于入栈的快照
  const snapshotKeyMode = ref<'blacklist' | 'whitelist'>('blacklist')
  const snapshotKeyList = ref<string[]>([
    'file',
    'files',
    'image',
    'images',
    'texture',
    'textures',
    '__threeObject'
  ])

  function setSnapshotKeyMode(mode: 'blacklist' | 'whitelist') {
    snapshotKeyMode.value = mode
  }

  function setSnapshotKeyList(keys: string[]) {
    snapshotKeyList.value = Array.from(new Set(keys))
  }

  /** 深拷贝并过滤不可序列化对象，保证快照稳定可用。 */
  function cloneSnapshot(value: SceneSnapshot): SceneSnapshot {
    const raw = toRaw(value)
    const seen = new WeakSet<object>()
    const json = JSON.stringify(raw, (key, val) => {
      if (key) {
        const keyList = snapshotKeyList.value
        // 白名单/黑名单：过滤掉不希望进入快照的字段
        if (snapshotKeyMode.value === 'blacklist' && keyList.includes(key)) return undefined
        if (snapshotKeyMode.value === 'whitelist' && !keyList.includes(key)) return undefined
      }
      // 过滤不可序列化对象，避免快照崩溃
      if (typeof val === 'function' || typeof val === 'symbol') return undefined
      if (typeof File !== 'undefined' && val instanceof File) return undefined
      if (typeof Blob !== 'undefined' && val instanceof Blob) return undefined
      if (typeof ImageBitmap !== 'undefined' && val instanceof ImageBitmap) return undefined
      if (typeof window !== 'undefined') {
        if (val === window) return undefined
        if (typeof Window !== 'undefined' && val instanceof Window) return undefined
      }
      if (val && typeof val === 'object') {
        // 跳过循环引用，保证 JSON 序列化稳定
        if (seen.has(val)) return undefined
        seen.add(val)
      }
      return val
    })
    return JSON.parse(json) as SceneSnapshot
  }

  /** 生成撤回/回退所需的最小快照。 */
  function createSnapshot(): SceneSnapshot {
    return cloneSnapshot({
      objectDataList: toRaw(objectDataList.value),
      selectedObjectId: selectedObjectId.value,
      aIds: aIds.value
    })
  }

  /** 推入历史栈，并清空回退栈，保持线性时间线。 */
  function pushHistorySnapshot(snapshot?: SceneSnapshot) {
    if (isRestoring.value) return
    undoStack.value.push(snapshot ? cloneSnapshot(snapshot) : createSnapshot())
    if (undoStack.value.length > maxHistory) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  /** 用去抖限制高频变更的快照记录频率。 */
  function scheduleHistorySnapshot() {
    if (isRestoring.value) return
    if (!lastSnapshot.value) lastSnapshot.value = createSnapshot()
    if (!historyDebounceTimer.value) {
      // 去抖的第一次进入立刻记录，避免丢掉“起点”
      pushHistorySnapshot(lastSnapshot.value)
    }
    if (historyDebounceTimer.value) {
      clearTimeout(historyDebounceTimer.value)
    }
    historyDebounceTimer.value = setTimeout(() => {
      historyDebounceTimer.value = null
      // 去抖结束后刷新最新快照作为下一次起点
      lastSnapshot.value = createSnapshot()
    }, historyDebounceMs.value)
  }

  /** 恢复快照并基于数据重建 three 对象映射。 */
  function applySnapshot(snapshot: SceneSnapshot) {
    isRestoring.value = true
    objectDataList.value = cloneSnapshot(snapshot).objectDataList
    selectedObjectId.value = snapshot.selectedObjectId
    aIds.value = snapshot.aIds

    objectsMap.value.forEach(obj => {
      if (obj.parent) obj.parent.remove(obj)
    })
    objectsMap.value.clear()
    if (threeScene.value) {
      // 按数据重新构建 three 对象
      setThreeScene(threeScene.value)
    }
    selectionVersion.value += 1
    isRestoring.value = false
    if (historyDebounceTimer.value) {
      clearTimeout(historyDebounceTimer.value)
      historyDebounceTimer.value = null
    }
    // 让快照起点与当前状态对齐，避免连续撤回不一致
    lastSnapshot.value = createSnapshot()
  }

  /** 撤回到上一条快照。 */
  function undo() {
    const snapshot = undoStack.value.pop()
    if (!snapshot) return
    // 撤回前先把当前状态塞到回退栈
    redoStack.value.push(createSnapshot())
    applySnapshot(snapshot)
  }

  /** 回退到下一条快照。 */
  function redo() {
    const snapshot = redoStack.value.pop()
    if (!snapshot) return
    // 回退前先把当前状态塞到撤回栈
    undoStack.value.push(createSnapshot())
    applySnapshot(snapshot)
  }

  async function initScene() {
    const { sceneData } = await initDB() // 初始化数据库并获取场景数据
    name.value = sceneData.name // store 名称
    version.value = sceneData.version // store 版本
    aIds.value = sceneData.aIds // 场景内对象自增ID
    rendererSettings.value = {
      ...rendererSettings.value,
      ...(sceneData.rendererSettings ?? {})
    }
    assets.value = (sceneData.assets ?? []) as AssetRef[]
    isRestoring.value = true
    objectDataList.value = sceneData.objectDataList ?? [] // 引擎逻辑层级

    // 数据准备好后，确保 three 场景和对象同步
    const scene = threeScene.value ?? new Scene()
    setThreeScene(scene)
    isRestoring.value = false

    undoStack.value = []
    redoStack.value = []
    lastSnapshot.value = createSnapshot()
    if (historyDebounceTimer.value) {
      clearTimeout(historyDebounceTimer.value)
      historyDebounceTimer.value = null
    }
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
      }
      syncThreeObjectState(obj, data)
      if (data.type === 'camera' && obj instanceof Object3D) {
        if ((obj as any).isPerspectiveCamera) {
          applyCameraSettings(obj as any, data)
        }
      }
      if (data.type === 'light') {
        applyLightSettings(obj as any, data)
      }
      if (data.type === 'model' && data.assetId) {
        void loadModelAssetIntoObject(data.assetId, data.id)
      }
    })

    objectsMap.value.forEach((obj, id) => {
      const data = dataMap.get(id)
      if (!data) return
      if (obj.parent) obj.parent.remove(obj)
      const parent = data.parentId ? objectsMap.value.get(data.parentId) : threeScene.value
      parent?.add(obj)
    })

    const sceneData = objectDataList.value.find(item => item.type === 'scene')
    if (sceneData && threeScene.value) {
      applySceneSettings(threeScene.value, sceneData)
    }
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
    const lightTypeChanged =
      target.type === 'light'
      && patch.userData !== undefined
      && (patch.userData as any)?.lightType !== (target.userData as any)?.lightType
    const assetChanged = patch.assetId !== undefined && patch.assetId !== target.assetId
    let meshRebuilt = false
    if (typeChanged || helperChanged || lightTypeChanged) { // 类型或helper配置变更需要重建three对象
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

    if (nextData.type === 'scene' && threeScene.value) {
      applySceneSettings(threeScene.value, nextData)
    }
    if (nextData.type === 'camera') {
      const obj = objectsMap.value.get(id)
      if (obj && (obj as any).isPerspectiveCamera) {
        applyCameraSettings(obj as any, nextData)
      }
    }
    if (nextData.type === 'light') {
      const obj = objectsMap.value.get(id)
      if (obj) applyLightSettings(obj as any, nextData)
    }
    if (nextData.type === 'model' && (assetChanged || typeChanged) && nextData.assetId) {
      void loadModelAssetIntoObject(nextData.assetId, id)
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

  // function disposeMaterial(material: any, disposedMaterials: Set<unknown>, disposedTextures: Set<unknown>) {
  //   if (!material || disposedMaterials.has(material)) return
  //   const textureKeys = [
  //     'map',
  //     'lightMap',
  //     'aoMap',
  //     'emissiveMap',
  //     'bumpMap',
  //     'normalMap',
  //     'displacementMap',
  //     'roughnessMap',
  //     'metalnessMap',
  //     'alphaMap',
  //     'envMap',
  //     'specularMap',
  //     'gradientMap',
  //     'matcap'
  //   ]
  //   textureKeys.forEach(key => {
  //     const texture = material[key]
  //     if (texture && typeof texture.dispose === 'function' && !disposedTextures.has(texture)) {
  //       texture.dispose()
  //       disposedTextures.add(texture)
  //     }
  //   })
  //   if (typeof material.dispose === 'function') {
  //     material.dispose()
  //   }
  //   disposedMaterials.add(material)
  // }

  // function disposeObject(obj: Object3D, seen: Set<Object3D>, disposedGeometries: Set<unknown>, disposedMaterials: Set<unknown>, disposedTextures: Set<unknown>) {
  //   if (seen.has(obj)) return
  //   seen.add(obj)

  //   obj.children.slice().forEach(child => disposeObject(child, seen, disposedGeometries, disposedMaterials, disposedTextures))

  //   const anyObj = obj as any
  //   if (anyObj.geometry && typeof anyObj.geometry.dispose === 'function' && !disposedGeometries.has(anyObj.geometry)) {
  //     anyObj.geometry.dispose()
  //     disposedGeometries.add(anyObj.geometry)
  //   }
  //   if (anyObj.material) {
  //     if (Array.isArray(anyObj.material)) {
  //       anyObj.material.forEach((mat: any) => disposeMaterial(mat, disposedMaterials, disposedTextures))
  //     } else {
  //       disposeMaterial(anyObj.material, disposedMaterials, disposedTextures)
  //     }
  //   }
  //   const disposeFn = (anyObj as any).dispose
  //   if (typeof disposeFn === 'function') {
  //     disposeFn.call(anyObj)
  //   }
  //   if (obj.parent) {
  //     obj.parent.remove(obj)
  //   }
  // }

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
        row.assets = JSON.stringify(assets.value)
        row.rendererSettings = JSON.stringify(rendererSettings.value)
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

  /** 统一监听器：所有数据变化都走去抖快照。 */
  watch(objectDataList, () => {
    // 所有变更统一进入去抖记录
    scheduleHistorySnapshot()
  }, { deep: true, flush: 'sync' })

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
    setThreeScene,
    addSceneObjectData,
    updateSceneObjectData,
    removeSceneObjectData,
    importModelFile,
    undo,
    redo,
    // 获取树形结构
    getObjectTree,
    applyObjectTree,

    threeScene,
    webGPURenderer,
    rendererSettings,
    assets,

    clearScene,
    saveScene,
    
    transformMode,
    transformSpace,

    notification,
    dialogProvider,
    undoStack,
    redoStack,
    snapshotKeyMode,
    snapshotKeyList,
    setSnapshotKeyMode,
    setSnapshotKeyList
  }
})
