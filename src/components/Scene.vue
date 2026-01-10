<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRenderer } from '@/composables/useRenderer'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { useDialog, useNotification } from 'naive-ui'

  const renderer = useRenderer()
  const sceneStore = useSceneStore()

  onMounted(async () => {
    sceneStore.notification = useNotification();
    sceneStore.dialogProvider = useDialog();
    renderer.initSceneBackground()
    await sceneStore.initScene().catch((e: any) => console.error('Scene init failed', e))
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
