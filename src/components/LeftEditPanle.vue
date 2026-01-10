<script setup lang="ts">
  import { type TreeDropInfo, type TreeOption,type TabsProps, NIcon } from 'naive-ui'
  import { ref,computed, watchEffect, h } from 'vue'
  import { Cube, OptionsSharp, CubeOutline } from '@vicons/ionicons5'
  import { TextureOutlined } from '@vicons/material'

  import AttributesPanel from './panles/Attributes.vue'
  import GeometryAttrPanel from './panles/GeometryAttr.vue'
  import MaterialAttrPanel from './panles/MaterialAttr.vue'
  import HelperAttributesPanel from './panles/HelperAttributes.vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'

  // 获取树形数据
  const sceneStore = useSceneStore()

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

  function updatePrefixWithExpaned(
    _keys: Array<string | number>,
    _option: Array<TreeOption | null>,
    meta: {
      node: TreeOption | null
      action: 'expand' | 'collapse' | 'filter'
    }
  ) {
    if (!meta.node)
      return
    switch (meta.action) {
      case 'expand':
        meta.node.prefix = () =>
          h(NIcon, null, {
            default: () => h(Cube)
          })
        break
      case 'collapse':
        meta.node.prefix = () =>
          h(NIcon, null, {
            default: () => h(Cube)
          })
        break
    }
  }
  function nodeProps({ option }: { option: TreeOption }) {
    return {
      onClick() {
        console.log(option);
        
        sceneStore.selectedObjectId = option.key as string;
      },
      onContextmenu(e: MouseEvent): void {
      }
        
    }
  }

  const placement = ref<NonNullable<TabsProps['placement']>>('left')
  const type = ref<TabsProps['type']>('card')

  const tabKey = ref('attributes-tab');
  const tabs = computed(() => {
    const currentType = sceneStore.cureentObjectData?.type
    const isMesh = currentType === 'mesh'
    const isHelper = currentType === 'helper'
    return [
    { name: 'attributes-tab',icon: OptionsSharp, label: '属性', component: AttributesPanel, isShow: true },
    { name: 'helper-tab',icon: CubeOutline, label: '辅助对象', component: HelperAttributesPanel, isShow: isHelper },
    { name: 'geometry-tab',icon: Cube, label: '几何组件', component: GeometryAttrPanel, isShow: isMesh },
    { name: 'material-tab',icon: TextureOutlined, label: '材质组件', component: MaterialAttrPanel, isShow: isMesh }
  ].filter(tab => tab.isShow)
  });

</script>

<template>
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
      :key="tabKey"
      type="line"
      animated
      placement="left"
      style="width: 100%; height: 60%;"
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
