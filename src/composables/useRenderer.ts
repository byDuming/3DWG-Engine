import { ref, shallowRef, onBeforeUnmount, watch } from 'vue'
import { Scene, PerspectiveCamera, Color } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import {
  WebGLRenderer,
  NoToneMapping,
  LinearToneMapping,
  ReinhardToneMapping,
  CineonToneMapping,
  ACESFilmicToneMapping,
  SRGBColorSpace,
  LinearSRGBColorSpace,
  BasicShadowMap,
  PCFShadowMap,
  PCFSoftShadowMap,
  VSMShadowMap
} from 'three'
import { Raycaster, Vector2, Box3, Vector3, Object3D } from 'three'
import { useSceneStore } from '@/stores/modules/useScene.store.ts'
import { MapControls } from 'three/addons/controls/MapControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

export function useRenderer(opts: { antialias?: boolean } = {}) {
  const sceneStore = useSceneStore()
  const container = ref<HTMLElement | null>(null)
  const camera = shallowRef<PerspectiveCamera | null>(null)
  const controls = shallowRef<MapControls | null>(null)
  const transformControls = shallowRef<TransformControls | null>(null)
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  let pointerDownPos: { x: number; y: number } | null = null

  function findCameraFromStore() {
    const map = sceneStore.objectsMap as unknown as Map<string, PerspectiveCamera>
    for (const obj of map.values()) {
      if ((obj as any).userData?.sceneObjectType === 'camera' && obj instanceof PerspectiveCamera) {
        return obj
      }
    }
    return null
  }

  function ensureCamera() {
    const existing = findCameraFromStore()
    if (existing) {
      camera.value = existing
      return existing
    }

    const cameraData = sceneStore.objectDataList.find(item => item.type === 'camera')
    const cameraObj = cameraData ? sceneStore.objectsMap.get(cameraData.id) : null
    if (cameraObj instanceof PerspectiveCamera) {
      camera.value = cameraObj
      return cameraObj
    }

    const newCameraData = sceneStore.addSceneObjectData({
      type: 'camera',
      name: 'Main Camera',
      parentId: 'Scene',
      transform: { position: [25, 30, 20] }
    })
    const created = sceneStore.objectsMap.get(newCameraData.id)
    if (created instanceof PerspectiveCamera) {
      camera.value = created
      return created
    }
    return null
  }

  function resize() {
    if (!container.value || !sceneStore.webGPURenderer || !camera.value) return
    const w = container.value.clientWidth || window.innerWidth
    const h = container.value.clientHeight || window.innerHeight
    sceneStore.webGPURenderer.setSize(w, h)
    camera.value.aspect = w / h
    camera.value.updateProjectionMatrix()
  }

  function start() {
    if (!camera.value) ensureCamera()
    if (!sceneStore.webGPURenderer || !sceneStore.threeScene || !camera.value) return
    sceneStore.webGPURenderer.setAnimationLoop(() => {
      controls.value?.update()
      if (transformControls.value?.object && !isInSceneGraph(transformControls.value.object)) {
        transformControls.value.detach()
      }
      sceneStore.webGPURenderer!.render(sceneStore.threeScene!, camera.value!)
    })
  }

  function stop() {
    sceneStore.webGPURenderer?.setAnimationLoop(null)
  }

  function dispose() {
    stop()
    const pendingTransform = detachTransformControls()
    const pendingControls = controls.value
    controls.value = null
    try {
      sceneStore.webGPURenderer?.dispose()
    } catch (e) {
      // ignore
    }
    try {
      pendingTransform?.dispose()
    } catch (e) {
      // ignore
    }
    try {
      pendingControls?.dispose()
    } catch (e) {
      // ignore
    }
    // const dom = sceneStore.webGPURenderer?.domElement
    container.value?.removeEventListener('pointerdown', handlePointerDown)
    container.value?.removeEventListener('pointerup', handlePointerUp)
    sceneStore.webGPURenderer = null
    sceneStore.threeScene = null
    camera.value = null
    transformControls.value = null
  }

  let pendingAttachId: string | null = null

  function isInSceneGraph(obj: Object3D) {
    let current: Object3D | null = obj
    const scene = sceneStore.threeScene
    if (!scene) return false
    while (current) {
      if (current === scene) return true
      current = current.parent as Object3D | null
    }
    return false
  }

  function attachTransformControl(id: string | null) {
    if (!transformControls.value) return
    if (!id) {
      transformControls.value.detach()
      pendingAttachId = null
      return
    }
    const target = sceneStore.objectsMap.get(id)
    if (!target) {
      transformControls.value.detach()
      return
    }
    if (!isInSceneGraph(target)) {
      if (pendingAttachId !== id) {
        pendingAttachId = id
        requestAnimationFrame(() => {
          if (pendingAttachId === id) attachTransformControl(id)
        })
      }
      return
    }
    pendingAttachId = null
    transformControls.value.attach(target)
  }

  function handlePointerDown(event: PointerEvent) {
    console.log('handlePointDown');
    
    pointerDownPos = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent) {
    console.log('handlePointerUp');
    const dom = sceneStore.webGPURenderer?.domElement
    if (!camera.value || !dom || transformControls.value?.dragging) return
    const moved = pointerDownPos
      ? Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y)
      : 0
    pointerDownPos = null

    if (moved > 2) return

    const rect = dom.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera.value)
    const objects = Array.from(sceneStore.objectsMap.values())
    const intersections = raycaster.intersectObjects(objects, true)
    const getSceneObjectId = (obj: Object3D | null) => {
      let current: Object3D | null = obj
      while (current) {
        const id = (current as any).userData?.sceneObjectId as string | undefined
        if (id) return id
        current = current.parent as Object3D | null
      }
      return null
    }
    const hit = intersections.find(item => {
      const id = getSceneObjectId(item.object)
      if (!id) return false
      const data = sceneStore.objectDataList.find(entry => entry.id === id)
      if (data?.selectable === false) return false
      ;(item as any).__sceneObjectId = id
      return true
    })

    const hitId = (hit as any)?.__sceneObjectId ?? null
    if (!hitId) {
      sceneStore.selectedObjectId = null
      return
    }
    const selected = sceneStore.objectDataList.find(item => item.id === hitId)
    if (selected?.type === 'helper') {
      const helperTargetId = (selected.helper as any)?.targetId as string | undefined
      if (helperTargetId && sceneStore.objectDataList.some(item => item.id === helperTargetId)) {
        sceneStore.selectedObjectId = helperTargetId
        return
      }
    }
    sceneStore.selectedObjectId = hitId
  }

  function focusSelectedObject() {
    if (!controls.value || !camera.value) return
    const id = sceneStore.selectedObjectId
    if (!id) return
    const obj = sceneStore.objectsMap.get(id)
    if (!obj) return
    const box = new Box3().setFromObject(obj)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const distance = Math.max(size.x, size.y, size.z) * 2 || 10
    const dir = new Vector3().subVectors(camera.value.position, controls.value.target).normalize()
    controls.value.target.copy(center)
    camera.value.position.copy(center).addScaledVector(dir, distance)
    controls.value.update()
  }

  function handleKeyDown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target as HTMLElement | null)?.isContentEditable) return
    if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      // Ctrl/Cmd + Z 撤回，Shift + Z 回退
      if (event.shiftKey) {
        sceneStore.redo?.()
      } else {
        sceneStore.undo?.()
      }
      return
    }
    if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      sceneStore.saveScene?.()
      return
    }
    switch (event.key.toLowerCase()) {
      case 'w':
        sceneStore.transformMode = 'translate'
        transformControls.value?.setMode('translate')
        break
      case 'e':
        sceneStore.transformMode = 'rotate'
        transformControls.value?.setMode('rotate')
        break
      case 'r':
        sceneStore.transformMode = 'scale'
        transformControls.value?.setMode('scale')
        break
      case 'v': {
        const nextSpace = sceneStore.transformSpace === 'world' ? 'local' : 'world'
        sceneStore.transformSpace = nextSpace as any
        transformControls.value?.setSpace(nextSpace)
        break
      }
      case 'f':
        focusSelectedObject()
        break
    }
  }

  function initSceneBackground() {
    console.log('初始化renderere');
    
    container.value?.addEventListener('pointerup', handlePointerUp)
    container.value?.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    
    const scene = new Scene()
    if (!sceneStore.threeScene) {
      scene.background = new Color('#CFD8DC')
    } else if (!sceneStore.threeScene.background) {
      sceneStore.threeScene.background = new Color('#CFD8DC')
    }
    sceneStore.setThreeScene(scene)

    ensureCamera()

    rebuildRenderer()

    window.addEventListener('resize', resize)
  }

  watch(() => sceneStore.selectedObjectId, (id) => {
    attachTransformControl(id)
  }, { immediate: true })

  watch(() => sceneStore.selectionVersion, () => {
    attachTransformControl(sceneStore.selectedObjectId)
  })

  watch(() => sceneStore.transformMode, (mode) => {
    transformControls.value?.setMode(mode)
  })

  watch(() => sceneStore.transformSpace, (space) => {
    transformControls.value?.setSpace(space)
  })

  watch(() => sceneStore.rendererSettings, () => {
    applyRendererSettings()
  }, { deep: true })

  watch(() => sceneStore.rendererSettings.rendererType, () => {
    rebuildRenderer()
  })

  function applyRendererSettings() {
    const renderer = sceneStore.webGPURenderer
    if (!renderer) return
    const settings = sceneStore.rendererSettings
    const toneMappingMap: Record<string, number> = {
      none: NoToneMapping,
      linear: LinearToneMapping,
      reinhard: ReinhardToneMapping,
      cineon: CineonToneMapping,
      acesFilmic: ACESFilmicToneMapping
    }
    const colorSpaceMap: Record<string, string> = {
      srgb: SRGBColorSpace,
      linear: LinearSRGBColorSpace
    }
    if (settings.toneMapping in toneMappingMap) {
      renderer.toneMapping = toneMappingMap[settings.toneMapping]
    }
    if (typeof settings.toneMappingExposure === 'number') {
      renderer.toneMappingExposure = settings.toneMappingExposure
    }
    if (settings.outputColorSpace in colorSpaceMap) {
      ;(renderer as any).outputColorSpace = colorSpaceMap[settings.outputColorSpace]
    }
    if ((renderer as any).isWebGLRenderer) {
      ;(renderer as any).useLegacyLights = settings.useLegacyLights
    }
    if ((renderer as any).shadowMap) {
      ;(renderer as any).shadowMap.enabled = settings.shadows
    }
    if ((renderer as any).shadowMap && (renderer as any).isWebGLRenderer) {
      const shadowTypeMap: Record<string, number> = {
        basic: BasicShadowMap,
        pcf: PCFShadowMap,
        pcfSoft: PCFSoftShadowMap,
        vsm: VSMShadowMap
      }
      if (settings.shadowType in shadowTypeMap) {
        ;(renderer as any).shadowMap.type = shadowTypeMap[settings.shadowType]
      }
    }
  }

  function rebuildRenderer() {
    stop()
    const pendingTransform = detachTransformControls()
    const pendingControls = controls.value
    controls.value = null
    if (sceneStore.webGPURenderer) {
      try {
        sceneStore.webGPURenderer.dispose()
      } catch (e) {
        // ignore
      }
      const dom = sceneStore.webGPURenderer.domElement
      dom?.parentElement?.removeChild(dom)
      sceneStore.webGPURenderer = null
    }
    try {
      pendingTransform?.dispose()
    } catch (e) {
      // ignore
    }
    try {
      pendingControls?.dispose()
    } catch (e) {
      // ignore
    }

    if (!container.value) return
    const antialias = opts.antialias ?? sceneStore.rendererSettings.antialias
    if (sceneStore.rendererSettings.rendererType === 'webgl') {
      sceneStore.webGPURenderer = new WebGLRenderer({ antialias })
    } else {
      sceneStore.webGPURenderer = new WebGPURenderer({ antialias })
    }
    container.value.appendChild(sceneStore.webGPURenderer.domElement)

    if (camera.value) {
      controls.value = new MapControls(camera.value, container.value)

      transformControls.value = new TransformControls(camera.value, sceneStore.webGPURenderer.domElement)
      transformControls.value.addEventListener('dragging-changed', (event) => {
        if (controls.value) controls.value.enabled = !event.value
      })
      transformControls.value.addEventListener('objectChange', () => {
        const obj = transformControls.value?.object
        const id = obj?.userData?.sceneObjectId
        if (!obj || !id) return
        sceneStore.updateSceneObjectData(id, {
          transform: {
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z]
          }
        })
      })

      const gizmo = transformControls.value.getHelper()
      sceneStore.threeScene?.add(gizmo)
      attachTransformControl(sceneStore.selectedObjectId)
      transformControls.value.setMode(sceneStore.transformMode)
      transformControls.value.setSpace(sceneStore.transformSpace)
    }
    applyRendererSettings()
    resize()
    start()
  }

  function detachTransformControls() {
    if (!transformControls.value) return null
    const helper = transformControls.value.getHelper()
    sceneStore.threeScene?.remove(helper)
    transformControls.value.detach()
    const pending = transformControls.value
    transformControls.value = null
    return pending
  }

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('keydown', handleKeyDown)
    dispose()
  })

  return {
    initSceneBackground,
    container,
    camera,
    controls,
    transformControls,
    start,
    stop,
    resize,
    dispose
  }
}
