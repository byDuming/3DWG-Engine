<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { useRenderer } from '@/composables/useRenderer'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { sceneApi } from '@/services/sceneApi'
  import { useDialog, useNotification, useMessage } from 'naive-ui'

  /**
   * 3D 视图容器组件：
   * - 负责把 three.js 渲染 canvas 挂载到 DOM
   * - 初始化通知 / 对话框注入到 sceneStore
   * - 统一处理场景数据加载和切换
   * 
   * 场景切换流程：
   * 1. 加载场景数据到 store (objectDataList, assets 等)
   * 2. 调用 useRenderer.switchScene() 完成 three.js 层的切换
   */

  const props = defineProps<{
    sceneId?: number | null
  }>()

  const sceneStore = useSceneStore()
  const message = useMessage()
  const { container, init, switchScene, captureScreenshot } = useRenderer()
  
  // container 在模板中使用 ref="container"
  // @ts-ignore - Vue 模板中的 ref 绑定
  void container

  /**
   * 加载场景数据到 store（不涉及 three.js 层）
   */
  async function loadSceneData(id: number): Promise<boolean> {
    try {
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

      // 清空历史栈
      sceneStore.historyManager.clear()
      sceneStore.isSceneReady = true

      message.success('场景加载成功')
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
    // 清理旧数据
    sceneStore.objectsMap.clear()
    sceneStore.objectDataList = []
    sceneStore.selectedObjectId = null
    sceneStore.currentSceneId = null

    // 从本地数据库加载默认场景
    await sceneStore.initScene()
  }

  /**
   * 完整的场景切换流程
   */
  async function doSwitchScene(sceneId: number | null | undefined) {
    if (sceneId) {
      const loaded = await loadSceneData(sceneId)
      if (!loaded) {
        await loadDefaultScene()
      }
    } else {
      await loadDefaultScene()
    }
    
    // 通知 useRenderer 切换场景（创建新的 three.js 场景并同步所有对象）
    switchScene()
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
    
    // 设置截图函数到 store
    sceneStore.setCaptureScreenshotFn(captureScreenshot)

    // 加载初始场景
    await doSwitchScene(props.sceneId)
  })
</script>

<template>
  <div id="mainContainer" ref="container"></div>
</template>

<style scoped>
  #mainContainer {
    width: 100%;
    height: 100%;
  }
</style>
