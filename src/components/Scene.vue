<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRenderer } from '@/composables/useRenderer'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { useNotification } from 'naive-ui'

  const renderer = useRenderer()
  const sceneStore = useSceneStore()

  onMounted(async () => {
    renderer.initSceneBackground()
    sceneStore.notification = useNotification();
    await sceneStore.initScene().catch((e: any) => console.error('Scene init failed', e))
    sceneStore.addSceneObjectData({
      type: 'mesh',
      name: 'demo-box',
      mesh: { geometry: { type: 'box', width: 1, height: 1, depth: 1 }, material: { type: 'standard', color: '#00ff00' } },
      transform: { position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      parentId: 'Scene'
    })
  })
</script>

<template>
  <!-- <n-button @click="sceneStore.clearScene()" type="primary">
    释放内存
  </n-button> -->
  
  <div id="mainContainer" :ref="renderer.container"></div>
</template>

<style scoped>
  #mainContainer {
    width: 100%;
    height: 100%;
  }
</style>
