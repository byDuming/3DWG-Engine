
<script setup lang="ts">
  import { ref,onMounted } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store.ts'
  import { Move,Resize,Earth } from '@vicons/ionicons5'
  import { Md3DRotationFilled,PlaceFilled } from '@vicons/material'
  // 场景
  import Scene from '@/components/Scene.vue'
  // 编辑面板
  import LeftEditPanle from '@/components/LeftEditPanle.vue'

  const sceneStore = useSceneStore()
  function handleChangeTransformMode(mode: 'translate' | 'rotate' | 'scale',event: Event) {
    event.stopPropagation();
    sceneStore.transformMode = mode;
  }
  // 分割比例
  const split = ref<number>(0.86);
</script>

<template>
  <n-notification-provider placement="top-left">
    <n-flex vertical style="width: 100%; height: 100%;">
      <n-float-button-group shape="square" position="absolute" left="2vw" top="2vw" style="z-index: 1000;">
        <n-tooltip trigger="hover" placement="right">
          <template #trigger>
            <n-float-button :class="sceneStore.transformMode === 'translate' ? 'n-float-button-active' : ''" @click="handleChangeTransformMode('translate', $event)">
              <n-icon><Move /></n-icon>
            </n-float-button>
          </template>
          移动
        </n-tooltip>
        <n-tooltip trigger="hover" placement="right">
          <template #trigger>
            <n-float-button :class="sceneStore.transformMode === 'rotate' ? 'n-float-button-active' : ''" @click.stop="sceneStore.transformMode = 'rotate'">
              <n-icon><Md3DRotationFilled /></n-icon>
            </n-float-button>
          </template>
          旋转
        </n-tooltip>
        <n-tooltip trigger="hover" placement="right">
          <template #trigger>
            <n-float-button :class="sceneStore.transformMode === 'scale' ? 'n-float-button-active' : ''" @click.stop="sceneStore.transformMode = 'scale'">
              <n-icon><Resize /></n-icon>
            </n-float-button>
          </template>
          缩放
        </n-tooltip>
        <n-tooltip trigger="hover" placement="right">
          <template #trigger>
            <n-float-button @click.stop="sceneStore.transformSpace = sceneStore.transformSpace === 'local' ? 'world' : 'local'">
              <n-icon><PlaceFilled v-if="sceneStore.transformSpace === 'local'" /><Earth v-else-if="sceneStore.transformSpace === 'world'" /></n-icon>
            </n-float-button>
          </template>
          {{ sceneStore.transformSpace === 'local' ? '本地' : '世界' }}
        </n-tooltip>
      </n-float-button-group>
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
</template>

<style scoped>
  .n-float-button-active {
    background-color: #409eff !important;
    color: white;
  }
</style>
