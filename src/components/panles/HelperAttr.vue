<script setup lang="ts">
  import { computed } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import type {
    AxesHelperData,
    GridHelperData,
    PolarGridHelperData,
    ArrowHelperData,
    BoxHelperData,
    Box3HelperData,
    CameraHelperData,
    DirectionalLightHelperData,
    HemisphereLightHelperData,
    PointLightHelperData,
    SpotLightHelperData,
    RectAreaLightHelperData,
    PlaneHelperData,
    SkeletonHelperData,
    LightProbeHelperData,
    VertexNormalsHelperData,
    HelperData
  } from '@/types/helper'

  const sceneStore = useSceneStore()

  // 当前选中对象的 helper 数据
  type TargetedHelper = HelperData & { targetId?: string }
  type Vec3Key = 'dir' | 'origin' | 'min' | 'max' | 'normal'

  const linkedHelpers = computed(() =>
    sceneStore.objectDataList.filter(item =>
      item.type === 'helper' && (item.helper as TargetedHelper | undefined)?.targetId === sceneStore.selectedObjectId
    )
  )
  const selectedHelper = computed(() => {
    const selected = sceneStore.objectDataList.find(item => item.id === sceneStore.selectedObjectId)
    return selected?.type === 'helper' ? selected : null
  })
  const activeHelper = computed(() => selectedHelper.value ?? linkedHelpers.value[0] ?? null)

  const helper = computed(() => activeHelper.value?.helper as HelperData | undefined)
  const helperType = computed(() => helper.value?.type)
  // const hasTargetId = computed(() => !!helper.value && 'targetId' in helper.value)
  const showTargetSelector = computed(() => {
    const type = helperType.value
    if (!type) return false
    return [
      'camera',
      'box',
      'directionalLight',
      'hemisphereLight',
      'pointLight',
      'spotLight',
      'rectAreaLight',
      'skeleton',
      'lightProbe',
      'vertexNormals'
    ].includes(type)
  })
  const targetIdValue = computed(() =>
    helper.value && 'targetId' in helper.value ? (helper.value as TargetedHelper).targetId ?? '' : ''
  )
  const targetFilter = computed(() => {
    const type = helperType.value
    if (!type) return null
    if (type === 'camera') return { objectType: 'camera' }
    if (['directionalLight', 'pointLight', 'spotLight', 'hemisphereLight', 'rectAreaLight'].includes(type)) {
      return { objectType: 'light', lightType: type }
    }
    return null
  })
  const targetOptions = computed(() => {
    const baseTargets = sceneStore.objectDataList
      .filter(item => item.type !== 'helper' && item.type !== 'scene')
    const filtered = baseTargets.filter(item => {
      const filter = targetFilter.value
      if (!filter) return true
      if (item.type !== filter.objectType) return false
      if (filter.objectType === 'light') {
        return (item.userData as any)?.lightType === filter.lightType
      }
      return true
    })

    const ensureCurrent = targetIdValue.value
      ? baseTargets.find(item => item.id === targetIdValue.value)
      : undefined
    const optionsSource = ensureCurrent && !filtered.some(item => item.id === ensureCurrent.id)
      ? [ensureCurrent, ...filtered]
      : filtered

    return optionsSource.map(item => ({
      label: item.name ? `${item.name} (${item.type})` : item.id,
      value: item.id
    }))
  })

  // 按类型拆分 helper 数据，避免访问不存在的字段
  const axesHelper = computed(() => helper.value?.type === 'axes' ? (helper.value as AxesHelperData) : null)
  const gridHelper = computed(() => helper.value?.type === 'grid' ? (helper.value as GridHelperData) : null)
  const polarGridHelper = computed(() => helper.value?.type === 'polarGrid' ? (helper.value as PolarGridHelperData) : null)
  const arrowHelper = computed(() => helper.value?.type === 'arrow' ? (helper.value as ArrowHelperData) : null)
  const boxHelper = computed(() => helper.value?.type === 'box' ? (helper.value as BoxHelperData) : null)
  const box3Helper = computed(() => helper.value?.type === 'box3' ? (helper.value as Box3HelperData) : null)
  const cameraHelper = computed(() => helper.value?.type === 'camera' ? (helper.value as CameraHelperData) : null)
  const directionalLightHelper = computed(() =>
    helper.value?.type === 'directionalLight' ? (helper.value as DirectionalLightHelperData) : null
  )
  const hemisphereLightHelper = computed(() =>
    helper.value?.type === 'hemisphereLight' ? (helper.value as HemisphereLightHelperData) : null
  )
  const pointLightHelper = computed(() =>
    helper.value?.type === 'pointLight' ? (helper.value as PointLightHelperData) : null
  )
  const spotLightHelper = computed(() =>
    helper.value?.type === 'spotLight' ? (helper.value as SpotLightHelperData) : null
  )
  const rectAreaLightHelper = computed(() =>
    helper.value?.type === 'rectAreaLight' ? (helper.value as RectAreaLightHelperData) : null
  )
  const planeHelper = computed(() => helper.value?.type === 'plane' ? (helper.value as PlaneHelperData) : null)
  const skeletonHelper = computed(() => helper.value?.type === 'skeleton' ? (helper.value as SkeletonHelperData) : null)
  const lightProbeHelper = computed(() => helper.value?.type === 'lightProbe' ? (helper.value as LightProbeHelperData) : null)
  const vertexNormalsHelper = computed(() =>
    helper.value?.type === 'vertexNormals' ? (helper.value as VertexNormalsHelperData) : null
  )

  // 合并更新 helper 配置
  function updateHelper(patch: Record<string, unknown>) {
    const id = activeHelper.value?.id
    if (!id) return
    const current = activeHelper.value?.helper
    if (!current) return
    const next = { ...current, ...patch }
    sceneStore.updateSceneObjectData(id, { helper: next } as any)
  }

  function updateHelperNumber(key: string, value: number | null) {
    updateHelper({ [key]: Number(value ?? 0) })
  }

  function updateHelperText(key: string, value: string) {
    updateHelper({ [key]: value })
  }

  function updateHelperVec3(key: Vec3Key, axis: 0 | 1 | 2, value: number | null, fallback: [number, number, number]) {
    const current = (helper.value as any)?.[key] ?? fallback
    const next = [...current] as [number, number, number]
    next[axis] = Number(value ?? 0)
    updateHelper({ [key]: next })
  }
</script>

<template>
  <span>辅助对象属性</span>
  <br/>
  <br/>
  <n-flex class="n-flex" vertical>
    <n-grid x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">类型</n-gi>
      <n-gi class="gid-item" :span="6">
        <n-input :value="activeHelper?.type" type="text" disabled />
      </n-gi>
    </n-grid>

    <n-grid x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">辅助类型</n-gi>
      <n-gi class="gid-item" :span="6">
        <n-input :value="helperType" type="text" disabled />
      </n-gi>
    </n-grid>

    <n-grid v-if="showTargetSelector" x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">目标ID</n-gi>
      <n-gi class="gid-item" :span="6">
        <n-select
          :options="targetOptions"
          :value="targetIdValue"
          placeholder="选择目标对象"
          clearable
          filterable
          @update:value="(v: string) => updateHelperText('targetId', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="axesHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="axesHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="gridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="gridHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="gridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">分段</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="gridHelper?.divisions"
          @update:value="(v:number) => updateHelperNumber('divisions', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="gridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">中心线颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="gridHelper?.colorCenterLine ?? '#666666'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('colorCenterLine', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="gridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">网格颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="gridHelper?.colorGrid ?? '#444444'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('colorGrid', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="polarGridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">半径</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="polarGridHelper?.radius"
          @update:value="(v:number) => updateHelperNumber('radius', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="polarGridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">径向分段</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="polarGridHelper?.radials"
          @update:value="(v:number) => updateHelperNumber('radials', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="polarGridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">同心圆数量</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="polarGridHelper?.circles"
          @update:value="(v:number) => updateHelperNumber('circles', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="polarGridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">圆弧分段</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="polarGridHelper?.divisions"
          @update:value="(v:number) => updateHelperNumber('divisions', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="polarGridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色1</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="polarGridHelper?.color1 ?? '#444444'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color1', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="polarGridHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色2</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="polarGridHelper?.color2 ?? '#888888'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color2', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="arrowHelper" x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">方向</n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="x"
          :value="arrowHelper?.dir?.[0]"
          @update:value="(v:number) => updateHelperVec3('dir', 0, v, [0, 1, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="y"
          :value="arrowHelper?.dir?.[1]"
          @update:value="(v:number) => updateHelperVec3('dir', 1, v, [0, 1, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="z"
          :value="arrowHelper?.dir?.[2]"
          @update:value="(v:number) => updateHelperVec3('dir', 2, v, [0, 1, 0])"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="arrowHelper" x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">起点</n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="x"
          :value="arrowHelper?.origin?.[0]"
          @update:value="(v:number) => updateHelperVec3('origin', 0, v, [0, 0, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="y"
          :value="arrowHelper?.origin?.[1]"
          @update:value="(v:number) => updateHelperVec3('origin', 1, v, [0, 0, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="z"
          :value="arrowHelper?.origin?.[2]"
          @update:value="(v:number) => updateHelperVec3('origin', 2, v, [0, 0, 0])"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="arrowHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">长度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="arrowHelper?.length"
          @update:value="(v:number) => updateHelperNumber('length', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="arrowHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="arrowHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="arrowHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">箭头长度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="arrowHelper?.headLength"
          @update:value="(v:number) => updateHelperNumber('headLength', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="arrowHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">箭头宽度</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="arrowHelper?.headWidth"
          @update:value="(v:number) => updateHelperNumber('headWidth', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="boxHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="boxHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="box3Helper" x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">最小值</n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="x"
          :value="box3Helper?.min?.[0]"
          @update:value="(v:number) => updateHelperVec3('min', 0, v, [0, 0, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="y"
          :value="box3Helper?.min?.[1]"
          @update:value="(v:number) => updateHelperVec3('min', 1, v, [0, 0, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="z"
          :value="box3Helper?.min?.[2]"
          @update:value="(v:number) => updateHelperVec3('min', 2, v, [0, 0, 0])"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="box3Helper" x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">最大值</n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="x"
          :value="box3Helper?.max?.[0]"
          @update:value="(v:number) => updateHelperVec3('max', 0, v, [1, 1, 1])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="y"
          :value="box3Helper?.max?.[1]"
          @update:value="(v:number) => updateHelperVec3('max', 1, v, [1, 1, 1])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="z"
          :value="box3Helper?.max?.[2]"
          @update:value="(v:number) => updateHelperVec3('max', 2, v, [1, 1, 1])"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="box3Helper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="box3Helper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="cameraHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="10">无可编辑参数</n-gi>
    </n-grid>

    <n-grid v-if="directionalLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="directionalLightHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="directionalLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="directionalLightHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="hemisphereLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="hemisphereLightHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="hemisphereLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="hemisphereLightHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="pointLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">球体尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="pointLightHelper?.sphereSize"
          @update:value="(v:number) => updateHelperNumber('sphereSize', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="pointLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="pointLightHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="spotLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="spotLightHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="rectAreaLightHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="rectAreaLightHelper?.color ?? '#ffffff'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="planeHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="planeHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="planeHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="planeHelper?.color ?? '#444444'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="planeHelper" x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">法线</n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="x"
          :value="planeHelper?.normal?.[0]"
          @update:value="(v:number) => updateHelperVec3('normal', 0, v, [0, 1, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="y"
          :value="planeHelper?.normal?.[1]"
          @update:value="(v:number) => updateHelperVec3('normal', 1, v, [0, 1, 0])"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="z"
          :value="planeHelper?.normal?.[2]"
          @update:value="(v:number) => updateHelperVec3('normal', 2, v, [0, 1, 0])"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="planeHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">常量</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="planeHelper?.constant"
          @update:value="(v:number) => updateHelperNumber('constant', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="skeletonHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="10">无可编辑参数</n-gi>
    </n-grid>

    <n-grid v-if="lightProbeHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="lightProbeHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>

    <n-grid v-if="vertexNormalsHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">尺寸</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          :value="vertexNormalsHelper?.size"
          @update:value="(v:number) => updateHelperNumber('size', v)"
        />
      </n-gi>
    </n-grid>
    <n-grid v-if="vertexNormalsHelper" x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">颜色</n-gi>
      <n-gi class="gid-item" :span="7">
        <n-color-picker
          :value="vertexNormalsHelper?.color ?? '#444444'"
          :show-alpha="false"
          @update:value="(v: string) => updateHelperText('color', v)"
        />
      </n-gi>
    </n-grid>
  </n-flex>
</template>

<style scoped>
  .gid-item {
    margin-block: auto;
    font-weight: bold;
    margin-right: 0.3vw;
  }
</style>
