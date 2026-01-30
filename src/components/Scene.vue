<script setup lang="ts">
  import { onMounted, watch, watchEffect } from 'vue'
  import { useRenderer } from '@/composables/useRenderer'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { useLoadingStore } from '@/stores/modules/useLoading.store'
  import { sceneApi } from '@/services/sceneApi'
  import { useDialog, useNotification, useMessage } from 'naive-ui'
  import { pluginManager } from '@/core'
  import { useAnimationStore } from '@/stores/modules/useAnimation.store'
  import LoadingPage from './LoadingPage.vue'
  import { collectAllTextureUrls, loadTextureWithProgress, loadHDRTextureWithProgress, extractFileName } from '@/utils/threeObjectFactory'
  import type { SceneObjectData } from '@/interfaces/sceneInterface'

  /**
   * 3D 视图容器组件：
   * - 负责把 three.js 渲染 canvas 挂载到 DOM
   * - 初始化通知 / 对话框注入到 sceneStore
   * - 统一处理场景数据加载和切换
   * - 显示场景加载进度
   * 
   * 场景切换流程：
   * 1. 显示加载页面
   * 2. 加载场景数据到 store (objectDataList, assets 等)
   * 3. 预扫描并注册所有需要加载的资源
   * 4. 调用 useRenderer.switchScene() 完成 three.js 层的切换
   * 5. 加载完成后隐藏加载页面
   */

  const props = defineProps<{
    sceneId?: number | null
    mode?: 'preview' | 'edit'  // 预览模式 or 编辑模式
  }>()

  const sceneStore = useSceneStore()
  const loadingStore = useLoadingStore()
  const animationStore = useAnimationStore()
  const message = useMessage()
  const { container, camera, init, switchScene, captureScreenshot } = useRenderer()
  
  // container 在模板中使用 ref="container"
  // @ts-ignore - Vue 模板中的 ref 绑定
  void container

  // 同步 mode prop 到 sceneStore.isEditMode
  watchEffect(() => {
    sceneStore.isEditMode = props.mode !== 'preview'
  })

  /**
   * 收集场景中所有需要加载的资源
   */
  function collectResourcesToLoad(objectDataList: SceneObjectData[]): {
    models: Array<{ id: string; name: string; assetId: string }>
    textures: Set<string>
    hdrTextures: Set<string>
  } {
    const models: Array<{ id: string; name: string; assetId: string }> = []
    
    // 收集模型资源
    for (const obj of objectDataList) {
      if ((obj.type === 'model' || obj.type === 'pointCloud') && obj.assetId) {
        // 从资产列表获取名称
        const asset = sceneStore.assets.find((a: any) => a.id === obj.assetId)
        models.push({
          id: obj.assetId,
          name: asset?.name || obj.name || obj.id,
          assetId: obj.assetId
        })
      }
    }
    
    // 收集贴图资源
    const { textures, hdrTextures } = collectAllTextureUrls(objectDataList)
    
    return { models, textures, hdrTextures }
  }

  /**
   * 注册所有资源到加载管理器
   */
  function registerResources(resources: ReturnType<typeof collectResourcesToLoad>) {
    const items: Array<{ id: string; name: string; type: 'model' | 'texture' | 'hdr' | 'pointcloud' }> = []
    
    // 注册模型
    for (const model of resources.models) {
      items.push({
        id: `model_${model.assetId}`,
        name: model.name,
        type: 'model'
      })
    }
    
    // 注册普通贴图
    for (const url of resources.textures) {
      items.push({
        id: `texture_${url}`,
        name: extractFileName(url),
        type: 'texture'
      })
    }
    
    // 注册HDR贴图
    for (const url of resources.hdrTextures) {
      items.push({
        id: `hdr_${url}`,
        name: extractFileName(url),
        type: 'hdr'
      })
    }
    
    if (items.length > 0) {
      loadingStore.registerResources(items)
    }
  }

  /**
   * 预加载贴图资源
   */
  async function preloadTextures(resources: ReturnType<typeof collectResourcesToLoad>) {
    const promises: Promise<any>[] = []
    
    // 加载普通贴图
    for (const url of resources.textures) {
      const resourceId = `texture_${url}`
      loadingStore.markResourceLoading(resourceId)
      
      const promise = loadTextureWithProgress(url, {
        onProgress: (_, loaded, total) => {
          loadingStore.updateProgress(resourceId, (loaded / total) * 100, loaded, total)
        },
        onComplete: () => {
          loadingStore.markLoaded(resourceId)
        },
        onError: (_, error) => {
          loadingStore.markError(resourceId, error)
        }
      })
      promises.push(promise)
    }
    
    // 加载HDR贴图
    for (const url of resources.hdrTextures) {
      const resourceId = `hdr_${url}`
      loadingStore.markResourceLoading(resourceId)
      
      const promise = loadHDRTextureWithProgress(url, {
        onProgress: (_, loaded, total) => {
          loadingStore.updateProgress(resourceId, (loaded / total) * 100, loaded, total)
        },
        onComplete: () => {
          loadingStore.markLoaded(resourceId)
        },
        onError: (_, error) => {
          loadingStore.markError(resourceId, error)
        }
      })
      promises.push(promise)
    }
    
    // 等待所有贴图加载完成
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  /**
   * 加载场景数据到 store（不涉及 three.js 层）
   */
  async function loadSceneData(id: number): Promise<boolean> {
    try {
      loadingStore.setPhase('正在获取场景数据...')
      
      const sceneData = await sceneApi.getSceneById(id)
      if (!sceneData || !sceneData.id) {
        message.warning('场景不存在')
        return false
      }

      // 清理旧数据
      sceneStore.objectsMap.clear()
      sceneStore.objectDataList = []
      sceneStore.selectedObjectId = null

      // 加载新数据
      sceneStore.currentSceneId = sceneData.id
      sceneStore.name = sceneData.name
      sceneStore.version = sceneData.version
      sceneStore.aIds = sceneData.aIds
      sceneStore.rendererSettings = {
        ...sceneStore.rendererSettings,
        ...(sceneData.rendererSettings ?? {})
      }
      sceneStore.assets = (sceneData.assets ?? []) as any[]
      sceneStore.objectDataList = sceneData.objectDataList ?? []

      // 加载动画数据
      if (sceneData.animationData) {
        const { useAnimationStore } = await import('@/stores/modules/useAnimation.store')
        const animationStore = useAnimationStore()
        animationStore.setAnimationData(sceneData.animationData)
        console.log('[Scene] 已加载动画数据，剪辑数:', sceneData.animationData.clips?.length ?? 0)
      }

      // 清空历史栈
      sceneStore.historyManager.clear()
      sceneStore.isSceneReady = true

      return true
    } catch (error) {
      console.error('加载场景失败:', error)
      message.error('加载场景失败')
      return false
    }
  }

  /**
   * 加载默认场景数据
   */
  async function loadDefaultScene() {
    loadingStore.setPhase('正在加载本地场景...')
    
    // 清理旧数据
    sceneStore.objectsMap.clear()
    sceneStore.objectDataList = []
    sceneStore.selectedObjectId = null
    sceneStore.currentSceneId = null

    // 清理动画数据
    const { useAnimationStore } = await import('@/stores/modules/useAnimation.store')
    const animationStore = useAnimationStore()
    animationStore.setAnimationData(null)

    // 从本地数据库加载默认场景
    await sceneStore.initScene()
  }

  /**
   * 完整的场景切换流程
   * 
   * 加载顺序：
   * 1. 拉取场景数据
   * 2. 加载贴图
   * 3. 加载模型
   * 4. 显示场景
   */
  async function doSwitchScene(sceneId: number | null | undefined) {
    // 开始加载流程
    loadingStore.startLoading(true)
    
    try {
      // 1. 拉取场景数据
      loadingStore.setPhase('正在获取场景数据...')
      loadingStore.markSceneDataLoading()
      if (sceneId) {
        const loaded = await loadSceneData(sceneId)
        if (!loaded) {
          await loadDefaultScene()
        }
      } else {
        await loadDefaultScene()
      }
      loadingStore.markSceneDataLoaded()
      
      // 2. 分析并注册所有需要加载的资源
      const resources = collectResourcesToLoad(sceneStore.objectDataList)
      const totalResources = resources.models.length + resources.textures.size + resources.hdrTextures.size
      console.log(`[Scene] 需要加载的资源: ${resources.models.length} 个模型, ${resources.textures.size} 个贴图, ${resources.hdrTextures.size} 个HDR`)
      
      if (totalResources > 0) {
        registerResources(resources)
      }
      
      // 3. 加载贴图
      const hasTextures = resources.textures.size > 0 || resources.hdrTextures.size > 0
      if (hasTextures) {
        loadingStore.setPhase('正在加载贴图...')
        await preloadTextures(resources)
      }
      
      // 4. 加载模型（通过 switchScene 触发）
      if (resources.models.length > 0) {
        loadingStore.setPhase('正在加载模型...')
      } else {
        loadingStore.setPhase('正在初始化场景...')
      }
      await switchScene()
      
      // 5. 加载完成
      loadingStore.setPhase('加载完成')
      loadingStore.finishLoading(300)
      message.success('场景加载成功')
      
      // 场景切换和资产加载完成后，检查是否有自动播放的剪辑
      handleAutoPlayClips()
      
    } catch (error) {
      console.error('[Scene] 场景加载失败:', error)
      loadingStore.setPhase('加载失败')
      loadingStore.finishLoading(1000)
      message.error('场景加载失败')
    }
  }
  
  /**
   * 处理自动播放剪辑
   */
  async function handleAutoPlayClips() {
    const { useAnimationStore } = await import('@/stores/modules/useAnimation.store')
    const animationStore = useAnimationStore()
    
    // 获取所有启用且自动播放的剪辑
    const enabledAutoPlayClips = animationStore.clips.filter(
      clip => clip.playMode === 'auto' && (clip.enabled ?? true)
    )
    
    if (enabledAutoPlayClips.length === 0) {
      return
    }
    
    // 检查是否排队播放（以第一个剪辑的设置为准）
    const firstClip = enabledAutoPlayClips[0]
    if (!firstClip) return
    
    const shouldQueue = firstClip.queueOnAutoPlay ?? true
    
    if (!shouldQueue) {
      // 不排队：同时播放所有启用的自动播放剪辑（使用后台播放）
      console.log(`[Scene] 同时播放 ${enabledAutoPlayClips.length} 个自动播放剪辑（不排队）`)
      for (const clip of enabledAutoPlayClips) {
        console.log(`[Scene] 启动剪辑: ${clip.name}`)
        // 第一个剪辑作为前台播放（用于时间轴显示），其他使用后台播放
        if (clip === firstClip) {
          animationStore.playClip(clip.id)
        } else {
          animationStore.playClip(clip.id, { background: true })
        }
      }
      return
    }
    
    // 排队播放：收集所有设置了排队的自动播放剪辑
    const queuedClips = enabledAutoPlayClips.filter(clip => clip.queueOnAutoPlay !== false)
    
    if (queuedClips.length === 0) {
      // 如果没有排队的剪辑，只播放第一个
      console.log('[Scene] 自动播放剪辑（无排队剪辑，只播放第一个）:', firstClip.name)
      animationStore.playClip(firstClip.id)
      return
    }
    
    // 递归函数：依次播放所有排队的自动播放剪辑
    function playNextAutoClip(index: number) {
      if (index >= queuedClips.length) {
        console.log('[Scene] 所有排队的自动播放剪辑已播放完成')
        return
      }
      
      const clip = queuedClips[index]
      if (!clip) {
        console.warn(`[Scene] 索引 ${index} 的剪辑不存在`)
        return
      }
      
      const clipName = clip.name
      const clipId = clip.id
      
      console.log(`[Scene] 自动播放剪辑 [${index + 1}/${queuedClips.length}]:`, clipName)
      
      // 播放当前剪辑，并在完成时播放下一个
      animationStore.playClip(clipId, {
        onComplete: () => {
          console.log(`[Scene] 剪辑 "${clipName}" 播放完成，准备播放下一个`)
          // 播放下一个排队的自动播放剪辑
          playNextAutoClip(index + 1)
        }
      })
    }
    
    // 从第一个开始播放
    playNextAutoClip(0)
    console.log(`[Scene] 开始播放 ${queuedClips.length} 个排队的自动播放剪辑`)
  }

  // 监听 sceneId 变化，支持动态切换场景
  watch(() => props.sceneId, async (newId, oldId) => {
    // 只在 sceneId 真正变化时处理（排除初始化）
    if (newId !== oldId && oldId !== undefined) {
      await doSwitchScene(newId)
    }
  })

  onMounted(async () => {
    // 注入通知和对话框到 store
    sceneStore.notification = useNotification()
    sceneStore.dialogProvider = useDialog()

    // 初始化渲染器（只执行一次）
    init()

    // 设置插件系统上下文（只设置一次；three 引用会在渲染循环里同步）
    if (!pluginManager.getContext()) {
      const ctx = pluginManager.createContext(
        { scene: sceneStore as any, animation: animationStore as any },
        { scene: sceneStore.threeScene as any, camera: camera.value as any, renderer: sceneStore.renderer as any }
      )
      pluginManager.setContext(ctx)
      // 自动加载所有已启用的插件
      await pluginManager.loadEnabledPlugins()
    }
    
    // 设置截图函数到 store
    sceneStore.setCaptureScreenshotFn(captureScreenshot)

    // 加载初始场景
    await doSwitchScene(props.sceneId)
  })
</script>

<template>
  <div id="mainContainer" ref="container">
    <!-- 场景加载页面 -->
    <LoadingPage />
  </div>
</template>

<style scoped>
  #mainContainer {
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>
