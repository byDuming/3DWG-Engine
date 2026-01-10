<script setup lang="ts">
  import { type TreeDropInfo, type TreeOption,type TabsProps, NIcon, type DropdownOption } from 'naive-ui'
  import { ref,computed, watch, watchEffect, h, type Component, nextTick } from 'vue'
  import { Cube, OptionsSharp, CubeOutline, ColorPalette, Camera } from '@vicons/ionicons5'
  import { TextureOutlined,DeleteFilled,DriveFileRenameOutlineRound } from '@vicons/material'

  import AttributesPanel from './panles/Attributes.vue'
  import GeometryAttrPanel from './panles/GeometryAttr.vue'
  import MaterialAttrPanel from './panles/MaterialAttr.vue'
  import HelperAttributesPanel from './panles/HelperAttributes.vue'
  import SceneAttrPanel from './panles/SceneAttr.vue'
  import CameraAttrPanel from './panles/CameraAttr.vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { useUiEditorStore } from '@/stores/modules/uiEditor.store.vue'

  // 获取树形数据
  const sceneStore = useSceneStore()
  const uiEditorStore = useUiEditorStore()

  const treeData = ref<TreeOption[]>([])
  watchEffect(() => {
    treeData.value = sceneStore.getObjectTree()
  })

  function findSiblingsAndIndex(
    node: TreeOption,
    nodes?: TreeOption[]
  ): [TreeOption[], number] | [null, null] {
    if (!nodes)
      return [null, null]
    for (let i = 0; i < nodes.length; ++i) {
      const siblingNode = nodes[i]
      if (siblingNode?.key === node.key)
        return [nodes, i]
      const [siblings, index] = findSiblingsAndIndex(node, siblingNode?.children)
      if (siblings && index !== null)
        return [siblings, index]
    }
    return [null, null]
  }

  const expandedKeysRef = ref<string[]>(['Scene'])
  const checkedKeysRef = ref<string[]>([])
  function handleExpandedKeysChange(expandedKeys: string[]) {
    expandedKeysRef.value = expandedKeys
  }

  function handleCheckedKeysChange(checkedKeys: string[]) {
    checkedKeysRef.value = checkedKeys
  }

  function handleDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
    const [dragNodeSiblings, dragNodeIndex] = findSiblingsAndIndex(
      dragNode,
      treeData.value
    )
    if (dragNodeSiblings === null || dragNodeIndex === null)
      return
    dragNodeSiblings.splice(dragNodeIndex, 1)
    if (dropPosition === 'inside') {
      if (node.children) {
        node.children.unshift(dragNode)
      }
      else {
        node.children = [dragNode]
      }
    }
    else if (dropPosition === 'before') {
      const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, treeData.value)
      if (nodeSiblings === null || nodeIndex === null)
        return
      nodeSiblings.splice(nodeIndex, 0, dragNode)
    }
    else if (dropPosition === 'after') {
      const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, treeData.value)
      if (nodeSiblings === null || nodeIndex === null)
        return
      nodeSiblings.splice(nodeIndex + 1, 0, dragNode)
    }
    treeData.value = Array.from(treeData.value)
    sceneStore.applyObjectTree(treeData.value)
    console.log('Dropped', treeData.value,sceneStore.objectDataList)
  }

  function renderIcon(icon: Component) {
    return () => {
      return h(NIcon, null, {
        default: () => h(icon)
      })
    }
  }

  const showDropdownRef = ref(false)
  const optionsRef = ref<DropdownOption[]>([
    {
      label: '重命名',
      key: 'rename-object',
      icon: renderIcon(DriveFileRenameOutlineRound)
    },
    {
      label: '删除对象',
      key: 'delete-object',
      icon: renderIcon(DeleteFilled)
    }
  ])
  const xRef = ref(0)
  const yRef = ref(0)

  function handleSelect(key: string | number) {
    switch (key) {
      case 'delete-object':
        sceneStore.dialogProvider?.warning({
          title: '警告',
          content: `确定删除？【${sceneStore.cureentObjectData?.name || ''}】 它的子对象也会被一并删除！子对象：${sceneStore.cureentObjectData?.childrenIds?.length || 0} 个`,
          positiveText: '确定',
          negativeText: '不确定',
          draggable: true,
          onPositiveClick: () => {
            if (sceneStore.selectedObjectId) {
              sceneStore.notification?.success({
                title: '已删除对象',
                content: `对象ID: ${sceneStore.selectedObjectId}\n子对象: ${sceneStore.cureentObjectData?.childrenIds?.length || 0} 个`,
                duration: 2000,
              })
              sceneStore.removeSceneObjectData(sceneStore.selectedObjectId)
            }
          },
          onNegativeClick: () => {
            sceneStore.notification?.error({
              title: '取消删除',
              content: '操作已取消',
              duration: 2000,
            })
          }
        })
        
        break
    }
    
    showDropdownRef.value = false
  }

  function handleClickoutside() {
    showDropdownRef.value = false
  }
  
  function nodeProps({ option }: { option: TreeOption }) {
    return {
      onClick() {
        console.log(option);
        
        sceneStore.selectedObjectId = option.key as string;
      },
      onContextmenu(e: MouseEvent): void {
        sceneStore.selectedObjectId = option.key as string;
        showDropdownRef.value = true
        xRef.value = e.clientX
        yRef.value = e.clientY
        e.preventDefault()
      }
        
    }
  }

  watch(() => sceneStore.selectedObjectId, () => {
    uiEditorStore.resetTabForSelection()
  }, { immediate: true })

  const tabs = computed(() => {
    const currentType = sceneStore.cureentObjectData?.type
    const isMesh = currentType === 'mesh'
    const isHelper = currentType === 'helper'
    const isScene = currentType === 'scene'
    const isCamera = currentType === 'camera'
    return [
      { name: 'attributes-tab', icon: OptionsSharp, label: '属性', component: AttributesPanel, isShow: true },
      { name: 'scene-tab', icon: ColorPalette, label: '场景属性', component: SceneAttrPanel, isShow: isScene },
      { name: 'camera-tab', icon: Camera, label: '相机属性', component: CameraAttrPanel, isShow: isCamera },
      { name: 'helper-tab', icon: CubeOutline, label: '辅助对象', component: HelperAttributesPanel, isShow: isHelper },
      { name: 'geometry-tab', icon: Cube, label: '几何组件', component: GeometryAttrPanel, isShow: isMesh },
      { name: 'material-tab', icon: TextureOutlined, label: '材质组件', component: MaterialAttrPanel, isShow: isMesh }
    ].filter(tab => tab.isShow)
  })

</script>

<template>
  
    <n-dropdown
      trigger="manual"
      placement="bottom-start"
      :show="showDropdownRef"
      :options="optionsRef"
      :x="xRef"
      :y="yRef"
      @select="handleSelect"
      @clickoutside="handleClickoutside"
    />
    <n-tree
      block-line
      expand-on-click
      draggable
      :data="treeData"
      :checked-keys="checkedKeysRef"
      :expanded-keys="expandedKeysRef"
      @drop="handleDrop"
      @update:checked-keys="handleCheckedKeysChange"
      @update:expanded-keys="handleExpandedKeysChange"

      :selected-keys="[sceneStore.selectedObjectId]"
      

      style="width: 100%; height: 40%;"

      :node-props="nodeProps"
    />
    
    <n-divider />
    <n-tabs
      type="line"
      animated
      placement="left"
      style="width: 100%; height: 60%;"
      :value="uiEditorStore.tabKey ?? undefined"
      @update:value="(value: string) => uiEditorStore.setTabKey(value)"
    >
    <template v-for="tab in tabs" :key="tab">
      <n-tab-pane :name="tab.name">
        <template #tab>
          <n-popover placement="left" trigger="hover">
            <template #trigger>
              <n-icon size="22">
                <component :is="tab.icon" />
              </n-icon>
            </template>
            {{ tab.label }}
          </n-popover>
        </template>
        <!--属性面板内容-->
        <component v-if="sceneStore.cureentObjectData" :is="tab.component"/>
        <n-empty v-else description="未选择对象">
        </n-empty>
      </n-tab-pane>
    </template>
    </n-tabs>
</template>

<style scoped>
  
</style>
