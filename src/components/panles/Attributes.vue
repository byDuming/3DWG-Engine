<script setup lang="ts">
  import { ref,computed } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  const sceneStore = useSceneStore()

  function handleChange() {
    console.log('change')
  }

  
  type TransformKey = 'position' | 'rotation' | 'scale'

  function updateTransform(key: TransformKey, axis: 0 | 1 | 2, value: number | null) {
    const id = sceneStore.selectedObjectId
    if (!id) return
    const current = sceneStore.cureentObjectData?.transform[key] ?? [0, 0, 0]
    const next = [...current] as [number, number, number]
    next[axis] = Number(value ?? 0)
    sceneStore.updateSceneObjectData(id, { transform: { [key]: next } } as any)
  }

  function handleBlurChangePosition(value: number) {
    console.log('blur',value)
    sceneStore.updateSceneObjectData(sceneStore.selectedObjectId!, {
      transform: {
        position: [
          Number((document.querySelectorAll('input.n-input-number__input')[0] as HTMLInputElement).value),
          Number((document.querySelectorAll('input.n-input-number__input')[1] as HTMLInputElement).value),
          Number((document.querySelectorAll('input.n-input-number__input')[2] as HTMLInputElement).value)
        ],
        rotation: sceneStore.cureentObjectData?.transform.rotation!,
        scale: sceneStore.cureentObjectData?.transform.scale!
      }
    })
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
  <br/>
  
  <br/>
  <n-flex class="n-flex" vertical>
    <n-grid x-gap="12" :cols="8">
      <n-gi class="gid-item" :span="2">
        类型
      </n-gi>
      <n-gi class="gid-item" :span="6">
        <n-input :value="sceneStore.cureentObjectData?.type" type="text" disabled />
      </n-gi>
    </n-grid>

    
    <br/>
    <!-- 位置 -->
    <n-grid x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">
        位置
      </n-gi>
      <n-gi class="gid-item" :span="3">
          <n-input-number
            placeholder="x轴"
            :value="sceneStore.cureentObjectData?.transform.position[0]"
            @update:value="(v:number) => updateTransform('position', 0, v)"
            :show-button="false"
          />
      </n-gi>
      <n-gi class="gid-item" :span="3">
          <n-input-number
            placeholder="y轴"
            :value="sceneStore.cureentObjectData?.transform.position[1]"
            @update:value="(v:number) => updateTransform('position', 1, v)"
            :show-button="false"
          />
      </n-gi>
      <n-gi class="gid-item" :span="3">
          <n-input-number
            placeholder="z轴"
            :value="sceneStore.cureentObjectData?.transform.position[2]"
            @update:value="(v:number) => updateTransform('position', 2, v)"
            :show-button="false"
          />
      </n-gi>
    </n-grid>

    <br/>
    <!-- 旋转 -->
    <n-grid x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">
        旋转
      </n-gi>
      <n-gi class="gid-item" :span="3">
          <n-input-number
            placeholder="x轴"
            :value="sceneStore.cureentObjectData?.transform.rotation[0]"
            @update:value="(v:number) => updateTransform('rotation', 0, v)"
            :show-button="false"
          />
      </n-gi>
      <n-gi class="gid-item" :span="3">
          <n-input-number
            placeholder="y轴"
            :value="sceneStore.cureentObjectData?.transform.rotation[1]"
            @update:value="(v:number) => updateTransform('rotation', 1, v)"
            :show-button="false"
          />
      </n-gi>
      <n-gi class="gid-item" :span="3">
          <n-input-number
            placeholder="z轴"
            :value="sceneStore.cureentObjectData?.transform.rotation[2]"
            @update:value="(v:number) => updateTransform('rotation', 2, v)"
            :show-button="false"
          />
      </n-gi>
    </n-grid>

    <br/>
    <!-- 缩放 -->
    <n-grid x-gap="6" :cols="11">
      <n-gi class="gid-item" :span="2">
        缩放
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="x轴"
          :value="sceneStore.cureentObjectData?.transform.scale[0]"
          @update:value="(v:number) => updateTransform('scale', 0, v)"
          :show-button="false"
        >
        <template #suffix>
          °
        </template>
      </n-input-number>
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="y轴"
          :value="sceneStore.cureentObjectData?.transform.scale[1]"
          @update:value="(v:number) => updateTransform('scale', 1, v)"
          :show-button="false"
        >
          <template #suffix>
            °
          </template>
        </n-input-number>
      </n-gi>
      <n-gi class="gid-item" :span="3">
        <n-input-number
          placeholder="z轴"
          :value="sceneStore.cureentObjectData?.transform.scale[2]"
          @update:value="(v:number) => updateTransform('scale', 2, v)"
          :show-button="false"
        >
          <template #suffix>
            °
          </template>
        </n-input-number>
      </n-gi>
    </n-grid>

    <br/>
    <!-- 可见性 -->
    <n-grid x-gap="6" :cols="16">
      <n-gi class="gid-item" :span="4">
        可见性
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
    <br/>
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
    <br/>
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

    <br/>
<!-- 
    <n-flex style="margin-right: 0.3vw;">
      <n-input
        type="textarea"
        placeholder="自定义数据"
        :value="sceneStore.cureentObjectData?.userData ? JSON.stringify(sceneStore.cureentObjectData?.userData, null, 2) : ''"
        @update:value="(v:string) => {
          try {
            // const parsed = JSON.parse(v)
            sceneStore.updateSceneObjectData(sceneStore.selectedObjectId!, { userData: v } as any)
          } catch (e) {
            console.error('Invalid JSON', e)
          }
        }"
      />
    </n-flex> -->

  </n-flex>
</template>

<style scoped>
  
  .gid-item {
    margin-block: auto;
    font-weight: bold;
    margin-right: 0.3vw;
  }
</style>
