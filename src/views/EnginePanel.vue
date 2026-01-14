<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { sceneApi } from '@/services/sceneApi'
  import { useMessage } from 'naive-ui'
  // 场景视图
  import Scene from '@/components/Scene.vue'
  // 左侧编辑面板
  import LeftEditPanel from '@/components/LeftEditPanel.vue'

  const route = useRoute()
  const sceneStore = useSceneStore()
  const message = useMessage()

  // 分割比例（右侧属性面板宽度占比）
  const split = ref<number>(0.86)

  // 加载指定场景
  onMounted(async () => {
    const sceneId = route.query.sceneId
    if (sceneId) {
      try {
        const sceneData = await sceneApi.getSceneById(Number(sceneId))
        if (sceneData && sceneData.id) {
          // 设置当前场景ID
          sceneStore.currentSceneId = sceneData.id
          // 加载场景数据到 store
          sceneStore.name = sceneData.name
          sceneStore.version = sceneData.version
          sceneStore.aIds = sceneData.aIds
          sceneStore.rendererSettings = {
            ...sceneStore.rendererSettings,
            ...(sceneData.rendererSettings ?? {})
          }
          sceneStore.assets = (sceneData.assets ?? []) as any[]
          sceneStore.objectDataList = sceneData.objectDataList ?? []
          
          // 等待 Scene 组件初始化 threeScene，然后同步数据
          // 使用多次检查确保 threeScene 已经创建
          let retries = 0
          while (!sceneStore.threeScene && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 50))
            retries++
          }
          
          if (sceneStore.threeScene) {
            sceneStore.setThreeScene(sceneStore.threeScene)
            message.success('场景加载成功')
          } else {
            message.warning('场景数据已加载，但渲染器未初始化')
          }
        } else {
          message.warning('场景不存在，已加载默认场景')
          sceneStore.currentSceneId = null
          await sceneStore.initScene()
        }
      } catch (error) {
        console.error('加载场景失败:', error)
        message.error('加载场景失败，已加载默认场景')
        sceneStore.currentSceneId = null
        await sceneStore.initScene()
      }
    } else {
      // 没有指定场景ID，加载默认场景
      sceneStore.currentSceneId = null
      // 让 Scene 组件自己调用 initScene
    }
  })
</script>

<template>
      <n-flex vertical style="width: 100%; height: 100%;">
        <NSplit v-model:watch-size="split" v-model:size="split">
          <template #1>
            <Scene key="scene" />
          </template>
          <template #2>
            <LeftEditPanel key="LeftEditPanel" />
          </template>
        </NSplit>
      </n-flex>
</template>

<style scoped>

</style>
*** End Patch```} />
