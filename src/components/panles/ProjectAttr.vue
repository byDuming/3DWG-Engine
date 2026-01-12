<script setup lang="ts">
  import { computed } from 'vue'
  import { AlertCircleOutline } from '@vicons/ionicons5'
  import { useSceneStore } from '@/stores/modules/useScene.store'

  const sceneStore = useSceneStore()
  const settings = computed(() => sceneStore.rendererSettings)

  const toneMappingOptions = [
    { label: 'None', value: 'none' },
    { label: 'Linear', value: 'linear' },
    { label: 'Reinhard', value: 'reinhard' },
    { label: 'Cineon', value: 'cineon' },
    { label: 'ACESFilmic', value: 'acesFilmic' }
  ]
  const colorSpaceOptions = [
    { label: 'sRGB', value: 'srgb' },
    { label: 'Linear', value: 'linear' }
  ]
  const shadowTypeOptions = [
    { label: 'Basic', value: 'basic' },
    { label: 'PCF', value: 'pcf' },
    { label: 'PCF Soft', value: 'pcfSoft' },
    { label: 'VSM', value: 'vsm' }
  ]
  const rendererTypeOptions = [
    { label: 'WebGPU', value: 'webgpu' },
    { label: 'WebGL', value: 'webgl' }
  ]

  function updateSetting(key: string, value: unknown) {
    sceneStore.rendererSettings = {
      ...sceneStore.rendererSettings,
      [key]: value
    } as any
  }
</script>

<template>
  <span>工程属性</span>
  <br />
  <br />
  <n-flex class="n-flex" vertical>
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">
        渲染器
        <n-tooltip trigger="hover" placement="top">
          <template #trigger>
            <n-icon size="14" class="hint-icon">
              <AlertCircleOutline />
            </n-icon>
          </template>
          切换渲染器会重建渲染器，可能出现短暂闪烁。
        </n-tooltip>
      </n-gi>
      <n-gi class="gid-item" :span="7">
        <n-select
          :options="rendererTypeOptions"
          :value="settings.rendererType"
          placeholder="渲染器"
          @update:value="(v: string) => updateSetting('rendererType', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">
        <span class="label-with-tip">
          抗锯齿
          <n-tooltip trigger="hover" placement="top">
            <template #trigger>
              <n-icon size="14" class="hint-icon">
                <AlertCircleOutline />
              </n-icon>
            </template>
            抗锯齿需要重启渲染器后生效（保存后重启）。
          </n-tooltip>
        </span>
      </n-gi>
      <n-gi class="gid-item" :span="7">
        <n-switch
          :value="settings.antialias"
          @update:value="(v:boolean) => updateSetting('antialias', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">阴影</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-switch
          :value="settings.shadows"
          @update:value="(v:boolean) => updateSetting('shadows', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="settings.rendererType === 'webgl'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">阴影类型</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-select
          :options="shadowTypeOptions"
          :value="settings.shadowType"
          placeholder="阴影类型"
          @update:value="(v: string) => updateSetting('shadowType', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">色调映射</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-select
          :options="toneMappingOptions"
          :value="settings.toneMapping"
          placeholder="色调映射"
          @update:value="(v: string) => updateSetting('toneMapping', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">曝光</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="settings.toneMappingExposure"
          placeholder="曝光"
          @update:value="(v:number) => updateSetting('toneMappingExposure', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">色彩空间</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-select
          :options="colorSpaceOptions"
          :value="settings.outputColorSpace"
          placeholder="色彩空间"
          @update:value="(v: string) => updateSetting('outputColorSpace', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="settings.rendererType === 'webgl'" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">旧灯光</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-switch
          :value="settings.useLegacyLights"
          @update:value="(v:boolean) => updateSetting('useLegacyLights', v)"
        />
      </n-gi>
    </n-grid>
  </n-flex>
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
  .label-with-tip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .hint-icon {
    color: #909399;
    cursor: help;
  }
</style>
