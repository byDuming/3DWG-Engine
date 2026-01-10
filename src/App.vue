
<script setup lang="ts">
  import { ref,onMounted } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store.ts'
  import { Move,Resize,Earth, ArrowUndo, ArrowRedo,Cube } from '@vicons/ionicons5'
  import { Md3DRotationFilled,PlaceFilled } from '@vicons/material'
  import { geometryTypeOptions } from '@/types/geometry'
  import type { GeometryType } from '@/types/geometry'
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

  const showDropdown = ref(false)

  const lightOptions = [
    { label: '方向光', value: 'light:directionalLight' },
    { label: '点光', value: 'light:pointLight' },
    { label: '聚光', value: 'light:spotLight' },
    { label: '半球光', value: 'light:hemisphereLight' },
    { label: '区域光', value: 'light:rectAreaLight' },
    { label: '环境光', value: 'light:ambientLight' }
  ]

  const cameraOptions = [
    { label: '透视相机', value: 'perspective' }
  ]

  const helperOptions = [
    { label: '坐标轴', value: 'helper:axes' },
    { label: '网格', value: 'helper:grid' },
    { label: '极坐标网格', value: 'helper:polarGrid' },
    { label: '箭头', value: 'helper:arrow' },
    { label: '盒线', value: 'helper:box' },
    { label: '边界盒', value: 'helper:box3' },
    { label: '相机辅助', value: 'helper:camera' },
    { label: '平面辅助', value: 'helper:plane' },
    { label: '骨骼辅助', value: 'helper:skeleton' },
    { label: '光探钻辅助', value: 'helper:lightProbe' },
    { label: '法线辅助', value: 'helper:vertexNormals' },
    { label: '方向光辅助', value: 'helper:directionalLight' },
    { label: '点光辅助', value: 'helper:pointLight' },
    { label: '聚光辅助', value: 'helper:spotLight' },
    { label: '半球光辅助', value: 'helper:hemisphereLight' },
    { label: '区域光辅助', value: 'helper:rectAreaLight' }
  ]

  const objectOptions = [
    {
      label: '组',
      key: 'group'
    },
    {
      label: '网格',
      key: 'mesh',
      children: geometryTypeOptions.map(option => ({
        label: option.label,
        key: option.value
      }))
    },
    {
      label: '光源',
      key: 'light',
      children: lightOptions.map(option => ({
        label: option.label,
        key: option.value
      }))
    },
    {
      label: '相机',
      key: 'camera',
      children: cameraOptions.map(option => ({
        label: option.label,
        key: option.value
      }))
    },
    {
      label: '辅助对象',
      key: 'helper',
      children: helperOptions.map(option => ({
        label: option.label,
        key: option.value
      }))
    }
  ]

  function handleSelect(key: string | number) {
    const value = String(key)
    const geometryOption = geometryTypeOptions.find(option => option.value === value)
    const lightOption = lightOptions.find(option => option.value === value)
    const cameraOption = cameraOptions.find(option => option.value === value)
    const helperOption = helperOptions.find(option => option.value === value)
    const parentId = sceneStore.selectedObjectId ?? 'Scene'

    if (geometryOption) {
      const created = sceneStore.addSceneObjectData({
        type: 'mesh',
        name: geometryOption.label,
        parentId,
        mesh: {
          geometry: { type: geometryOption.value },
          material: { type: 'standard' }
        }
      })
      sceneStore.setSelectedObject(created.id)
      return
    }

    if (lightOption) {
      const lightType = lightOption.value.replace('light:', '')
      const created = sceneStore.addSceneObjectData({
        type: 'light',
        name: lightOption.label,
        parentId,
        userData: { lightType }
      })
      sceneStore.setSelectedObject(created.id)
      return
    }

    if (cameraOption) {
      const created = sceneStore.addSceneObjectData({
        type: 'camera',
        name: cameraOption.label,
        parentId
      })
      sceneStore.setSelectedObject(created.id)
      return
    }

    if (helperOption) {
      const targetId = sceneStore.selectedObjectId ?? undefined
      const helperType = helperOption.value.replace('helper:', '')
      const helperDefaults: Record<string, any> = {
        axes: { type: 'axes', size: 5 },
        grid: { type: 'grid', size: 40, divisions: 40, colorCenterLine: '#666666', colorGrid: '#444444' },
        polarGrid: { type: 'polarGrid', radius: 5, radials: 16, circles: 8, divisions: 64 },
        arrow: { type: 'arrow', dir: [0, 1, 0], origin: [0, 0, 0], length: 5, color: '#ffffff' },
        box: { type: 'box' },
        box3: { type: 'box3', min: [-1, -1, -1], max: [1, 1, 1] },
        camera: { type: 'camera' },
        plane: { type: 'plane', size: 5, normal: [0, 1, 0], constant: 0 },
        skeleton: { type: 'skeleton' },
        lightProbe: { type: 'lightProbe', size: 1 },
        vertexNormals: { type: 'vertexNormals', size: 1, color: '#444444' },
        directionalLight: { type: 'directionalLight' },
        pointLight: { type: 'pointLight', sphereSize: 0.5 },
        spotLight: { type: 'spotLight' },
        hemisphereLight: { type: 'hemisphereLight' },
        rectAreaLight: { type: 'rectAreaLight' }
      }
      const helper = helperDefaults[helperType] ?? { type: helperType }
      if (targetId && helper && typeof helper === 'object' && !helper.targetId) {
        helper.targetId = targetId
      }
      const created = sceneStore.addSceneObjectData({
        type: 'helper',
        name: helperOption.label,
        parentId,
        helper
      })
      sceneStore.setSelectedObject(created.id)
      return
    }

    if (value === 'group') {
      const created = sceneStore.addSceneObjectData({ type: 'group', name: '组', parentId })
      sceneStore.setSelectedObject(created.id)
    }
  }

</script>

<template>
  <n-dialog-provider>
    <n-notification-provider placement="top-left">

      <n-flex vertical style="width: 100%; height: 100%;">
        <!-- transform -->
        <n-float-button-group shape="square" position="fixed" left="2vw" top="2vw" style="z-index: 10;">
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
        <!-- undo/redo -->
        <n-float-button-group shape="square" position="fixed" left="2vw" top="9vw" style="z-index: 10;">
          <n-tooltip trigger="hover" placement="right">
            <template #trigger>
              <n-float-button :class="sceneStore.undoStack.length === 0 ? 'n-float-button-disabled' : ''" @click="sceneStore.undo">
                <n-icon><ArrowUndo /></n-icon>
              </n-float-button>
            </template>
            撤回
          </n-tooltip>
          <n-tooltip trigger="hover" placement="right">
            <template #trigger>
              <n-float-button :class="sceneStore.redoStack.length === 0 ? 'n-float-button-disabled' : ''" @click.stop="sceneStore.redo">
                <n-icon><ArrowRedo /></n-icon>
              </n-float-button>
            </template>
            回退
          </n-tooltip>
        </n-float-button-group>
        <!-- addObject -->
        <n-dropdown trigger="hover" :options="objectOptions" @select="handleSelect" placement="right-start" key="d">
          <n-float-button shape="square" position="fixed" left="2vw" top="13vw" style="z-index: 10;">
            <n-icon>
              <Cube />
            </n-icon>
          </n-float-button>
        </n-dropdown>

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
  .n-float-button-active {
    background-color: #409eff !important;
    color: white;
  }
  .n-float-button-disabled {
    color: #90A4AE;
  }
</style>
