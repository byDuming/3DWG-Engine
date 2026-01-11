<script setup lang="ts">
  import { computed } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'

  const sceneStore = useSceneStore()

  const lightData = computed(() => sceneStore.cureentObjectData?.userData ?? {})
  const lightType = computed(() => (lightData.value as any)?.lightType ?? '')

  const lightTypeOptions = [
    { label: '方向光', value: 'directionalLight' },
    { label: '点光', value: 'pointLight' },
    { label: '聚光', value: 'spotLight' },
    { label: '半球光', value: 'hemisphereLight' },
    { label: '区域光', value: 'rectAreaLight' },
    { label: '环境光', value: 'ambientLight' }
  ]

  function updateLight(patch: Record<string, unknown>) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    const current = sceneStore.cureentObjectData?.userData ?? {}
    sceneStore.updateSceneObjectData(id, { userData: { ...current, ...patch } } as any)
  }

  function updateLightType(value: string) {
    const defaults: Record<string, Record<string, unknown>> = {
      directionalLight: { color: '#ffffff', intensity: 1 },
      pointLight: { color: '#ffffff', intensity: 1, distance: 0, decay: 2 },
      spotLight: { color: '#ffffff', intensity: 1, distance: 0, decay: 2, angle: Math.PI / 3, penumbra: 0 },
      hemisphereLight: { skyColor: '#ffffff', groundColor: '#444444', intensity: 1 },
      rectAreaLight: { color: '#ffffff', intensity: 1, width: 10, height: 10 },
      ambientLight: { color: '#ffffff', intensity: 1 }
    }
    updateLight({
      lightType: value,
      ...(defaults[value] ?? {})
    })
  }
</script>

<template>
  <span>光源属性</span>
  <br />
  <br />
  <n-flex class="n-flex" vertical>
    <n-grid x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">类型</n-gi>
      <n-gi class="gid-item" :span="6">
        <n-select
          :options="lightTypeOptions"
          :value="lightType"
          placeholder="选择光源类型"
          @update:value="(v: string) => updateLightType(v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="lightType !== 'hemisphereLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="lightData?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateLight({ color: v })"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="lightType === 'hemisphereLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">天空色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="lightData?.skyColor ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateLight({ skyColor: v })"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="lightType === 'hemisphereLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">地面色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="lightData?.groundColor ?? '#444444'"
          :show-alpha="false"
          @update:value="(v: string) => updateLight({ groundColor: v })"
        />
      </n-gi>
    </n-grid>

    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">强度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.intensity ?? 1"
          @update:value="(v:number) => updateLight({ intensity: v })"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="lightType === 'pointLight' || lightType === 'spotLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">距离</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.distance ?? 0"
          @update:value="(v:number) => updateLight({ distance: v })"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="lightType === 'pointLight' || lightType === 'spotLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">衰减</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.decay ?? 2"
          @update:value="(v:number) => updateLight({ decay: v })"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="lightType === 'spotLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">角度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.angle ?? 1"
          @update:value="(v:number) => updateLight({ angle: v })"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="lightType === 'spotLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">半影</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.penumbra ?? 0"
          @update:value="(v:number) => updateLight({ penumbra: v })"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="lightType === 'rectAreaLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">宽度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.width ?? 10"
          @update:value="(v:number) => updateLight({ width: v })"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="lightType === 'rectAreaLight'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">高度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightData?.height ?? 10"
          @update:value="(v:number) => updateLight({ height: v })"
        />
      </n-gi>
    </n-grid>
  </n-flex>
</template>

<style scoped>
  .n-flex {
    padding-bottom: 5vw;
  }
  .gid-item {
    margin-block: auto;
    font-weight: bold;
    margin-right: 0.3vw;
    margin-bottom: 0.5vw;
  }
</style>
