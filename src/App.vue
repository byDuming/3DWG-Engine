
<script setup lang="ts">
  import { ref } from 'vue'
  // 场景
  import Scene from '@/components/Scene.vue'
  // 编辑面板
  import LeftEditPanle from '@/components/LeftEditPanle.vue'

  // 分割比例
  const split = ref<number>(0.86);

</script>

<template>
  <n-dialog-provider>
    <n-notification-provider placement="top-left">

      <n-flex vertical style="width: 100%; height: 100%;">
        

        <NSplit v-model:watch-size="split" v-model:size="split">
          <template #1>
            <Scene key="scene"/>
          </template>
          <template #2>
            <LeftEditPanle key="LeftEditPanle"/>
          </template>
        </NSplit>
      </n-flex>
    </n-notification-provider>
  </n-dialog-provider>
</template>

<style scoped>

</style>
