<script setup lang="ts">
  import { useSceneStore } from '@/stores/modules/useScene.store'

  const sceneStore = useSceneStore()

  type TransformKey = 'position' | 'rotation' | 'scale'

  function updateTransform(key: TransformKey, axis: 0 | 1 | 2, value: number | null) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    const current = sceneStore.cureentObjectData?.transform[key] ?? [0, 0, 0]
    const next = [...current] as [number, number, number]
    next[axis] = Number(value ?? 0)
    sceneStore.updateSceneObjectData(id, { transform: { [key]: next } } as any)
  }

  function updateVisible(visible: boolean) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    sceneStore.updateSceneObjectData(id, { visible } as any)
  }

  function updateFrustumCulled(frustumCulled: boolean) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    sceneStore.updateSceneObjectData(id, { frustumCulled } as any)
  }
</script>

<template>
  <span>属性面板</span>
  <br />
  <br />
  <n-flex class="n-flex" vertical>
    <n-grid x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">
        ID
      </n-gi>
      <n-gi class="gid-item" :span="6">
        <n-input :value="sceneStore.cureentObjectData?.id" type="text" placeholder="ID" disabled />
      </n-gi>
    </n-grid>
    <n-grid x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">
        类型
      </n-gi>
      <n-gi class="gid-item" :span="6">
        <n-input :value="sceneStore.cureentObjectData?.type" type="text" placeholder="类型" disabled />
      </n-gi>
    </n-grid>

    <br />
    <!-- 位置 -->
    <n-grid x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">
        位置
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="X"
          :value="sceneStore.cureentObjectData?.transform.position[0]"
          @update:value="(v:number) => updateTransform('position', 0, v)"
          :show-button="false"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="Y"
          :value="sceneStore.cureentObjectData?.transform.position[1]"
          @update:value="(v:number) => updateTransform('position', 1, v)"
          :show-button="false"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="Z"
          :value="sceneStore.cureentObjectData?.transform.position[2]"
          @update:value="(v:number) => updateTransform('position', 2, v)"
          :show-button="false"
        />
      </n-gi>
    </n-grid>

    <br />
    <!-- 旋转 -->
    <n-grid x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">
        旋转
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="X"
          :value="sceneStore.cureentObjectData?.transform.rotation[0]"
          @update:value="(v:number) => updateTransform('rotation', 0, v)"
          :show-button="false"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="Y"
          :value="sceneStore.cureentObjectData?.transform.rotation[1]"
          @update:value="(v:number) => updateTransform('rotation', 1, v)"
          :show-button="false"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="Z"
          :value="sceneStore.cureentObjectData?.transform.rotation[2]"
          @update:value="(v:number) => updateTransform('rotation', 2, v)"
          :show-button="false"
        />
      </n-gi>
    </n-grid>

    <br />
    <!-- 缩放 -->
    <n-grid x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">
        缩放
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="X"
          :value="sceneStore.cureentObjectData?.transform.scale[0]"
          @update:value="(v:number) => updateTransform('scale', 0, v)"
          :show-button="false"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="Y"
          :value="sceneStore.cureentObjectData?.transform.scale[1]"
          @update:value="(v:number) => updateTransform('scale', 1, v)"
          :show-button="false"
        />
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="Z"
          :value="sceneStore.cureentObjectData?.transform.scale[2]"
          @update:value="(v:number) => updateTransform('scale', 2, v)"
          :show-button="false"
        />
      </n-gi>
    </n-grid>

    <br />
    <!-- 可见性 -->
    <n-grid x-gap="6" :cols="16">
      <n-gi class="gid-item" :span="4">
        可见
      </n-gi>
      <n-gi class="gid-item" :span="4">
        <n-switch
          :value="sceneStore.cureentObjectData?.visible"
          @update:value="(v:boolean) => updateVisible(v)"
        />
      </n-gi>

      <n-gi class="gid-item" :span="5">
        视锥体剔除
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-switch
          :value="sceneStore.cureentObjectData?.frustumCulled"
          @update:value="(v:boolean) => updateFrustumCulled(v)"
        />
      </n-gi>
    </n-grid>
    <br />
    <!-- 阴影 -->
    <n-grid x-gap="6" :cols="16">
      <n-gi class="gid-item" :span="4">
        投射阴影
      </n-gi>
      <n-gi class="gid-item" :span="4">
        <n-switch
          :value="sceneStore.cureentObjectData?.castShadow"
          @update:value="(v:boolean) => sceneStore.updateSceneObjectData(sceneStore.selectedObjectId!, { castShadow: v } as any)"
        />
      </n-gi>

      <n-gi class="gid-item" :span="5">
        接收阴影
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-switch
          :value="sceneStore.cureentObjectData?.receiveShadow"
          @update:value="(v:boolean) => sceneStore.updateSceneObjectData(sceneStore.selectedObjectId!, { receiveShadow: v } as any)"
        />
      </n-gi>
    </n-grid>
    <br />
    <!-- 渲染顺序 -->
    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">
        渲染顺序
      </n-gi>
      <n-gi class="gid-item" :span="7">
        <n-input-number
          placeholder="从低到高"
          :value="sceneStore.cureentObjectData?.renderOrder"
          :validator="(x: number) => x >= 0"
          @update:value="(v:number) => sceneStore.updateSceneObjectData(sceneStore.selectedObjectId!, { renderOrder: v } as any)"
        />
      </n-gi>
    </n-grid>

    <n-grid x-gap="6" :cols="10">
      <n-gi class="gid-item" :span="3">
        选中
      </n-gi>
      <n-gi class="gid-item" :span="7">
        <n-switch
          :value="sceneStore.cureentObjectData?.selectable ?? true"
          @update:value="(v:boolean) => sceneStore.updateSceneObjectData(sceneStore.selectedObjectId!, { selectable: v } as any)"
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
