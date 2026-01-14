<script setup lang="ts">
  import { computed } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import type {
    GeometryData,
    BoxGeometryData,
    SphereGeometryData,
    CylinderGeometryData,
    ConeGeometryData,
    PlaneGeometryData,
    TorusGeometryData,
    TorusKnotGeometryData,
    PolyhedronGeometryData,
    CircleGeometryData,
    RingGeometryData,
    CapsuleGeometryData
  } from '@/types/geometry'

  const sceneStore = useSceneStore()

  // 当前选中对象的几何体数据
  const geometry = computed(() => sceneStore.currentObjectData?.mesh?.geometry as GeometryData | undefined)
  const geometryType = computed(() => geometry.value?.type)

  // 按类型拆分几何体数据
  const boxGeometry = computed(() => geometry.value?.type === 'box' ? (geometry.value as BoxGeometryData) : null)
  const sphereGeometry = computed(() => geometry.value?.type === 'sphere' ? (geometry.value as SphereGeometryData) : null)
  const cylinderGeometry = computed(() => geometry.value?.type === 'cylinder' ? (geometry.value as CylinderGeometryData) : null)
  const coneGeometry = computed(() => geometry.value?.type === 'cone' ? (geometry.value as ConeGeometryData) : null)
  const planeGeometry = computed(() => geometry.value?.type === 'plane' ? (geometry.value as PlaneGeometryData) : null)
  const torusGeometry = computed(() => geometry.value?.type === 'torus' ? (geometry.value as TorusGeometryData) : null)
  const torusKnotGeometry = computed(() => geometry.value?.type === 'torusKnot' ? (geometry.value as TorusKnotGeometryData) : null)
  const polyhedronGeometry = computed(() =>
    ['tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron'].includes(geometry.value?.type ?? '')
      ? (geometry.value as PolyhedronGeometryData)
      : null
  )
  const circleGeometry = computed(() => geometry.value?.type === 'circle' ? (geometry.value as CircleGeometryData) : null)
  const ringGeometry = computed(() => geometry.value?.type === 'ring' ? (geometry.value as RingGeometryData) : null)
  const capsuleGeometry = computed(() => geometry.value?.type === 'capsule' ? (geometry.value as CapsuleGeometryData) : null)

  // 合并更新几何体配置
  function updateGeometry(patch: Record<string, unknown>) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    const currentMesh = sceneStore.currentObjectData?.mesh
    if (!currentMesh?.geometry) return
    const nextGeometry = { ...currentMesh.geometry, ...patch }
    const nextMesh = { ...currentMesh, geometry: nextGeometry }
    sceneStore.updateSceneObjectData(id, { mesh: nextMesh } as any)
  }

  function updateGeometryNumber(key: string, value: number | null) {
    updateGeometry({ [key]: Number(value ?? 0) })
  }

  function updateGeometryBoolean(key: string, value: boolean) {
    updateGeometry({ [key]: value })
  }
</script>

<template>
  <span>几何体属性</span>
  <br/>
  <br/>
  
  <n-scrollbar style="max-height: 100%;" content-style="overflow: hidden;">
    <n-flex class="n-flex" vertical>
      <n-grid x-gap="12" :cols="8">
        <n-gi class="gid-item" :span="2">类型</n-gi>
        <n-gi class="gid-item" :span="6">
          <n-input :value="geometryType" type="text" disabled />
        </n-gi>
      </n-grid>

      <n-grid v-if="boxGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">宽度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="boxGeometry?.width" placeholder="宽度" @update:value="(v:number) => updateGeometryNumber('width', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="boxGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="boxGeometry?.height" placeholder="高度" @update:value="(v:number) => updateGeometryNumber('height', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="boxGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">深度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="boxGeometry?.depth" placeholder="深度" @update:value="(v:number) => updateGeometryNumber('depth', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="boxGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">宽度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="boxGeometry?.widthSegments" placeholder="宽度分段" @update:value="(v:number) => updateGeometryNumber('widthSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="boxGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="boxGeometry?.heightSegments" placeholder="高度分段" @update:value="(v:number) => updateGeometryNumber('heightSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="boxGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">深度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="boxGeometry?.depthSegments" placeholder="深度分段" @update:value="(v:number) => updateGeometryNumber('depthSegments', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.radius" placeholder="半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">经向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.widthSegments" placeholder="经向分段" @update:value="(v:number) => updateGeometryNumber('widthSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">纬向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.heightSegments" placeholder="纬向分段" @update:value="(v:number) => updateGeometryNumber('heightSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">水平起始角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.phiStart" placeholder="水平起始角" @update:value="(v:number) => updateGeometryNumber('phiStart', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">水平扫描角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.phiLength" placeholder="水平扫描角" @update:value="(v:number) => updateGeometryNumber('phiLength', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">垂直起始角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.thetaStart" placeholder="垂直起始角" @update:value="(v:number) => updateGeometryNumber('thetaStart', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="sphereGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">垂直扫描角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="sphereGeometry?.thetaLength" placeholder="垂直扫描角" @update:value="(v:number) => updateGeometryNumber('thetaLength', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">顶部半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.radiusTop" placeholder="顶部半径" @update:value="(v:number) => updateGeometryNumber('radiusTop', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">底部半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.radiusBottom" placeholder="底部半径" @update:value="(v:number) => updateGeometryNumber('radiusBottom', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.height" placeholder="高度" @update:value="(v:number) => updateGeometryNumber('height', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">径向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.radialSegments" placeholder="径向分段" @update:value="(v:number) => updateGeometryNumber('radialSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.heightSegments" placeholder="高度分段" @update:value="(v:number) => updateGeometryNumber('heightSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">打开两端</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-switch :value="cylinderGeometry?.openEnded" @update:value="(v:boolean) => updateGeometryBoolean('openEnded', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">起始角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.thetaStart" placeholder="起始角" @update:value="(v:number) => updateGeometryNumber('thetaStart', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="cylinderGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">扫描角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="cylinderGeometry?.thetaLength" placeholder="扫描角" @update:value="(v:number) => updateGeometryNumber('thetaLength', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">底面半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="coneGeometry?.radius" placeholder="底面半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="coneGeometry?.height" placeholder="高度" @update:value="(v:number) => updateGeometryNumber('height', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">径向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="coneGeometry?.radialSegments" placeholder="径向分段" @update:value="(v:number) => updateGeometryNumber('radialSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="coneGeometry?.heightSegments" placeholder="高度分段" @update:value="(v:number) => updateGeometryNumber('heightSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">打开两端</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-switch :value="coneGeometry?.openEnded" @update:value="(v:boolean) => updateGeometryBoolean('openEnded', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">起始角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="coneGeometry?.thetaStart" placeholder="起始角" @update:value="(v:number) => updateGeometryNumber('thetaStart', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="coneGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">扫描角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="coneGeometry?.thetaLength" placeholder="扫描角" @update:value="(v:number) => updateGeometryNumber('thetaLength', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="planeGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">宽度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="planeGeometry?.width" placeholder="宽度" @update:value="(v:number) => updateGeometryNumber('width', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="planeGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="planeGeometry?.height" placeholder="高度" @update:value="(v:number) => updateGeometryNumber('height', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="planeGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">宽度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="planeGeometry?.widthSegments" placeholder="宽度分段" @update:value="(v:number) => updateGeometryNumber('widthSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="planeGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">高度分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="planeGeometry?.heightSegments" placeholder="高度分段" @update:value="(v:number) => updateGeometryNumber('heightSegments', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="torusGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">主半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusGeometry?.radius" placeholder="主半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">管道半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusGeometry?.tube" placeholder="管道半径" @update:value="(v:number) => updateGeometryNumber('tube', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">径向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusGeometry?.radialSegments" placeholder="径向分段" @update:value="(v:number) => updateGeometryNumber('radialSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">圆环分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusGeometry?.tubularSegments" placeholder="圆环分段" @update:value="(v:number) => updateGeometryNumber('tubularSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">圆弧角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusGeometry?.arc" placeholder="圆弧角" @update:value="(v:number) => updateGeometryNumber('arc', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="torusKnotGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">主半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusKnotGeometry?.radius" placeholder="主半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusKnotGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">管道半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusKnotGeometry?.tube" placeholder="管道半径" @update:value="(v:number) => updateGeometryNumber('tube', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusKnotGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">管道分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusKnotGeometry?.tubularSegments" placeholder="管道分段" @update:value="(v:number) => updateGeometryNumber('tubularSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusKnotGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">径向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusKnotGeometry?.radialSegments" placeholder="径向分段" @update:value="(v:number) => updateGeometryNumber('radialSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusKnotGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">p</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusKnotGeometry?.p" placeholder="p" @update:value="(v:number) => updateGeometryNumber('p', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="torusKnotGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">q</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="torusKnotGeometry?.q" placeholder="q" @update:value="(v:number) => updateGeometryNumber('q', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="polyhedronGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="polyhedronGeometry?.radius" placeholder="半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="polyhedronGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">细分等级</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="polyhedronGeometry?.detail" placeholder="细分等级" @update:value="(v:number) => updateGeometryNumber('detail', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="circleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="circleGeometry?.radius" placeholder="半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="circleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="circleGeometry?.segments" placeholder="分段" @update:value="(v:number) => updateGeometryNumber('segments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="circleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">起始角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="circleGeometry?.thetaStart" placeholder="起始角" @update:value="(v:number) => updateGeometryNumber('thetaStart', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="circleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">扫描角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="circleGeometry?.thetaLength" placeholder="扫描角" @update:value="(v:number) => updateGeometryNumber('thetaLength', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="ringGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">内半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="ringGeometry?.innerRadius" placeholder="内半径" @update:value="(v:number) => updateGeometryNumber('innerRadius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="ringGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">外半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="ringGeometry?.outerRadius" placeholder="外半径" @update:value="(v:number) => updateGeometryNumber('outerRadius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="ringGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">圆周分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="ringGeometry?.thetaSegments" placeholder="圆周分段" @update:value="(v:number) => updateGeometryNumber('thetaSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="ringGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">径向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="ringGeometry?.phiSegments" placeholder="径向分段" @update:value="(v:number) => updateGeometryNumber('phiSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="ringGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">起始角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="ringGeometry?.thetaStart" placeholder="起始角" @update:value="(v:number) => updateGeometryNumber('thetaStart', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="ringGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">扫描角</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="ringGeometry?.thetaLength" placeholder="扫描角" @update:value="(v:number) => updateGeometryNumber('thetaLength', v)" />
        </n-gi>
      </n-grid>

      <n-grid v-if="capsuleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">半径</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="capsuleGeometry?.radius" placeholder="半径" @update:value="(v:number) => updateGeometryNumber('radius', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="capsuleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">中段长度</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="capsuleGeometry?.length" placeholder="中段长度" @update:value="(v:number) => updateGeometryNumber('length', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="capsuleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">端帽分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="capsuleGeometry?.capSegments" placeholder="端帽分段" @update:value="(v:number) => updateGeometryNumber('capSegments', v)" />
        </n-gi>
      </n-grid>
      <n-grid v-if="capsuleGeometry" x-gap="6" :cols="10">
        <n-gi class="gid-item" :span="3">径向分段</n-gi>
        <n-gi class="gid-item" :span="7">
          <n-input-number :value="capsuleGeometry?.radialSegments" placeholder="径向分段" @update:value="(v:number) => updateGeometryNumber('radialSegments', v)" />
        </n-gi>
      </n-grid>
    </n-flex>
  </n-scrollbar>
</template>

<style scoped>
  .gid-item {
    margin-block: auto;
    font-weight: bold;
    margin-right: 0.3vw;
    margin-bottom: 0.5vw;
  }
</style>
