<script setup lang="ts">
  import { computed } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import type { CameraSettings } from '@/interfaces/sceneInterface'

  const sceneStore = useSceneStore()
  const cameraSettings = computed(() => sceneStore.cureentObjectData?.camera as CameraSettings | undefined)

  function updateCameraSettings(patch: Partial<CameraSettings>) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    const current = sceneStore.cureentObjectData?.camera ?? {}
    sceneStore.updateSceneObjectData(id, { camera: { ...current, ...patch } } as any)
  }
</script>

<template>
  <span>相机属性</span>
  <br/>
  <br/>
  <n-scrollbar style="max-height: 100%;" content-style="overflow: hidden;">
    <n-flex class="n-flex" vertical>
      <n-grid x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">视角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number
            :value="cameraSettings?.fov ?? 50"
            placeholder="FOV"
            @update:value="(v:number) => updateCameraSettings({ fov: v })"
          />
        </n-gi>
      </n-grid>
      <n-grid x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">近裁剪</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number
            :value="cameraSettings?.near ?? 0.01"
            placeholder="near"
            @update:value="(v:number) => updateCameraSettings({ near: v })"
          />
        </n-gi>
      </n-grid>
      <n-grid x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">远裁剪</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number
            :value="cameraSettings?.far ?? 2000"
            placeholder="far"
            @update:value="(v:number) => updateCameraSettings({ far: v })"
          />
        </n-gi>
      </n-grid>
    </n-flex>
  </n-scrollbar>
</template>

<style scoped>
  .n-flex{
    padding-bottom: 5vw;
  }
  .gid-item {
    margin-block: auto;
    font-weight: bold;
    margin-right: 0.3vw;
    margin-bottom: 0.5vw;
  }
</style>
