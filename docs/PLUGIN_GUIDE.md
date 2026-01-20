# ThreeJS-Editor 插件系统开发指南

## 目录

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [快速开始：创建第一个插件](#快速开始创建第一个插件)
4. [扩展类型详解](#扩展类型详解)
5. [生命周期钩子](#生命周期钩子)
6. [引擎上下文 API](#引擎上下文-api)
7. [实战示例](#实战示例)
8. [最佳实践](#最佳实践)
9. [高级主题](#高级主题)

---

## 概述

ThreeJS-Editor 的插件系统采用**松耦合、可扩展**的架构设计，允许开发者在不修改引擎核心代码的情况下：

- 添加新的 3D 对象类型（如样条曲线、地形、粒子系统等）
- 注册自定义面板（属性编辑器、工具面板等）
- 扩展菜单和工具栏
- 添加自定义快捷键
- 监听并响应引擎的各种事件

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                   ThreeJS-Editor 核心                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PluginManager (插件管理器)           │   │
│  │                                                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ 插件 A  │ │ 插件 B  │ │ 插件 C  │  ...       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘            │   │
│  │       │           │           │                  │   │
│  │       ▼           ▼           ▼                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │           扩展注册表 (Registries)         │    │   │
│  │  │  • 对象类型  • 面板  • 菜单  • 快捷键     │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │            EngineContext (引擎上下文)             │   │
│  │  • Pinia Stores  • Three.js 实例  • 工具函数    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 核心概念

### 1. EnginePlugin（引擎插件）

插件的主体接口，定义了插件的基本信息和功能：

```typescript
interface EnginePlugin {
  // 必需属性
  id: string              // 插件唯一标识，建议使用 kebab-case，如 'my-awesome-plugin'
  name: string            // 插件显示名称
  version: string         // 版本号，遵循 semver 规范
  
  // 可选属性
  description?: string    // 插件描述
  author?: string         // 作者信息
  dependencies?: string[] // 依赖的其他插件 ID
  
  // 扩展注册
  objectTypes?: ObjectTypeExtension[]   // 自定义对象类型
  panels?: PanelExtension[]             // 自定义面板
  menuItems?: MenuItemExtension[]       // 菜单项
  shortcuts?: ShortcutExtension[]       // 快捷键
  toolbarItems?: ToolbarItemExtension[] // 工具栏按钮
  
  // 生命周期钩子
  hooks?: PluginHooks
  
  // 生命周期方法
  install(context: EngineContext): void | Promise<void>  // 安装时调用
  uninstall?(): void                                      // 卸载时调用
}
```

### 2. PluginManager（插件管理器）

插件管理器是整个插件系统的核心，负责：

- **插件生命周期管理**：注册、卸载、依赖检查
- **扩展注册表管理**：统一管理所有扩展点
- **事件分发**：在插件间传递事件
- **钩子调用**：在适当的时机调用插件的钩子函数

```typescript
// 使用 Vue Composable 访问插件管理器
import { usePluginManager } from '@/core'

const { 
  manager,      // PluginManager 实例
  plugins,      // 已注册插件列表 (computed)
  objectTypes,  // 所有对象类型 (computed)
  panels,       // 所有面板 (computed)
  menuItems,    // 所有菜单项 (computed)
  shortcuts,    // 所有快捷键 (computed)
  toolbarItems  // 所有工具栏项 (computed)
} = usePluginManager()
```

### 3. EngineContext（引擎上下文）

引擎上下文是插件与引擎核心通信的桥梁，提供：

- **Pinia Stores**：访问场景、动画等核心状态
- **Three.js 实例**：直接操作渲染器、场景、相机
- **注册函数**：动态注册/注销扩展
- **事件系统**：插件间通信
- **工具函数**：ID 生成、通知、对话框等

---

## 快速开始：创建第一个插件

### 步骤 1：创建插件文件

在 `src/plugins/` 目录下创建插件文件：

```typescript
// src/plugins/helloWorld.plugin.ts
import { definePlugin } from '@/core'

export const helloWorldPlugin = definePlugin({
  id: 'hello-world',
  name: 'Hello World 插件',
  version: '1.0.0',
  description: '我的第一个 3DWG 插件',
  author: '你的名字',

  // 安装函数 - 插件初始化逻辑
  install(context) {
    console.log('Hello World 插件已安装！')
    
    // 可以在这里进行初始化设置
    // 例如：加载配置、注册事件监听器等
  },

  // 卸载函数 - 清理逻辑
  uninstall() {
    console.log('Hello World 插件已卸载！')
  },

  // 生命周期钩子
  hooks: {
    onEngineReady(context) {
      console.log('引擎已准备就绪！')
      context.utils.notify({
        type: 'success',
        title: 'Hello World',
        content: '插件加载成功！'
      })
    }
  }
})
```

### 步骤 2：注册插件

在应用初始化时注册插件：

```typescript
// src/main.ts 或 src/App.vue
import { pluginManager } from '@/core'
import { helloWorldPlugin } from '@/plugins/helloWorld.plugin'

// 设置引擎上下文（通常在渲染器初始化后）
const context = pluginManager.createContext(
  { scene: useSceneStore(), animation: useAnimationStore() },
  { scene: threeScene, camera: threeCamera, renderer: webGLRenderer }
)
pluginManager.setContext(context)

// 注册插件
await pluginManager.register(helloWorldPlugin)
```

### 步骤 3：验证安装

启动应用后，你应该在控制台看到：
```
[PluginManager] Plugin Hello World 插件 v1.0.0 installed
Hello World 插件已安装！
引擎已准备就绪！
```

---

## 扩展类型详解

### 1. ObjectTypeExtension - 自定义对象类型

最强大的扩展点，允许你添加全新的 3D 对象类型到引擎中。

```typescript
interface ObjectTypeExtension {
  type: string                        // 类型标识（如 'spline', 'terrain'）
  label: string                       // 在 UI 中显示的名称
  icon?: Component                    // 图标组件
  category: 'primitive' | 'light' | 'camera' | 'effect' | 'helper' | 'custom'
  
  defaultData: () => Partial<SceneObjectData>  // 默认数据生成器
  createThreeObject: (data: SceneObjectData, context: EngineContext) => Object3D
  syncThreeObject?: (obj: Object3D, data: SceneObjectData, context: EngineContext) => void
  
  propertiesPanel?: Component         // 属性编辑面板
  selectable?: boolean                // 是否可选中
  supportedOperations?: Array<'translate' | 'rotate' | 'scale' | 'delete' | 'duplicate'>
}
```

**示例：添加一个自定义的圆环结（TorusKnot）对象类型**

```typescript
import * as THREE from 'three'
import { definePlugin, type ObjectTypeExtension } from '@/core'
import { markRaw } from 'vue'
import TorusKnotIcon from './icons/TorusKnotIcon.vue'
import TorusKnotProperties from './panels/TorusKnotProperties.vue'

const torusKnotType: ObjectTypeExtension = {
  type: 'torusKnot',
  label: '环面纽结',
  icon: markRaw(TorusKnotIcon),
  category: 'primitive',
  
  defaultData: () => ({
    type: 'mesh',
    name: '环面纽结',
    mesh: {
      geometry: {
        type: 'torusKnot',
        params: {
          radius: 1,
          tube: 0.4,
          tubularSegments: 64,
          radialSegments: 8,
          p: 2,
          q: 3
        }
      },
      material: {
        type: 'standard',
        color: '#4080ff'
      }
    }
  }),
  
  createThreeObject(data, context) {
    const params = data.mesh?.geometry.params || {}
    const geometry = new THREE.TorusKnotGeometry(
      params.radius || 1,
      params.tube || 0.4,
      params.tubularSegments || 64,
      params.radialSegments || 8,
      params.p || 2,
      params.q || 3
    )
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.mesh?.material.color || '#4080ff')
    })
    
    return new THREE.Mesh(geometry, material)
  },
  
  syncThreeObject(obj, data, context) {
    // 当数据更新时同步到 Three.js 对象
    const mesh = obj as THREE.Mesh
    const params = data.mesh?.geometry.params || {}
    
    // 重建几何体
    mesh.geometry.dispose()
    mesh.geometry = new THREE.TorusKnotGeometry(
      params.radius || 1,
      params.tube || 0.4,
      params.tubularSegments || 64,
      params.radialSegments || 8,
      params.p || 2,
      params.q || 3
    )
  },
  
  propertiesPanel: markRaw(TorusKnotProperties),
  selectable: true,
  supportedOperations: ['translate', 'rotate', 'scale', 'delete', 'duplicate']
}

export const torusKnotPlugin = definePlugin({
  id: 'torus-knot',
  name: '环面纽结插件',
  version: '1.0.0',
  
  objectTypes: [torusKnotType],
  
  install(context) {
    console.log('环面纽结对象类型已注册')
  }
})
```

### 2. PanelExtension - 自定义面板

在界面中添加新的面板。

```typescript
interface PanelExtension {
  id: string                            // 面板唯一标识
  name: string                          // 面板名称
  icon?: Component                      // 面板图标
  position: 'left' | 'right' | 'bottom' | 'floating'  // 位置
  component: Component                  // 面板 Vue 组件
  defaultVisible?: boolean              // 默认是否显示
  defaultSize?: number                  // 默认尺寸
  minSize?: number                      // 最小尺寸
  maxSize?: number                      // 最大尺寸
  closable?: boolean                    // 是否可关闭
  order?: number                        // 排序权重
}
```

**示例：添加一个场景统计面板**

```typescript
import { definePlugin, type PanelExtension } from '@/core'
import { markRaw } from 'vue'
import SceneStatsPanel from './panels/SceneStatsPanel.vue'
import StatsIcon from './icons/StatsIcon.vue'

const statsPanel: PanelExtension = {
  id: 'scene-stats',
  name: '场景统计',
  icon: markRaw(StatsIcon),
  position: 'right',
  component: markRaw(SceneStatsPanel),
  defaultVisible: false,
  defaultSize: 250,
  minSize: 200,
  maxSize: 400,
  closable: true,
  order: 100
}

export const sceneStatsPlugin = definePlugin({
  id: 'scene-stats',
  name: '场景统计插件',
  version: '1.0.0',
  
  panels: [statsPanel],
  
  install(context) {
    // 初始化
  }
})
```

**面板组件示例 (SceneStatsPanel.vue)**

```vue
<template>
  <div class="scene-stats-panel">
    <h3>场景统计</h3>
    <div class="stat-item">
      <span>对象数量:</span>
      <span>{{ objectCount }}</span>
    </div>
    <div class="stat-item">
      <span>三角面数:</span>
      <span>{{ triangleCount.toLocaleString() }}</span>
    </div>
    <div class="stat-item">
      <span>纹理数量:</span>
      <span>{{ textureCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { EngineContext } from '@/core'

// 通过 inject 获取引擎上下文
const context = inject<EngineContext>('engineContext')

const objectCount = computed(() => {
  return context?.stores.scene.scene.length || 0
})

const triangleCount = computed(() => {
  let count = 0
  context?.three.scene?.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const geometry = obj.geometry as THREE.BufferGeometry
      if (geometry.index) {
        count += geometry.index.count / 3
      } else if (geometry.attributes.position) {
        count += geometry.attributes.position.count / 3
      }
    }
  })
  return count
})

const textureCount = computed(() => {
  const textures = new Set()
  context?.three.scene?.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      materials.forEach((mat) => {
        if (mat.map) textures.add(mat.map.uuid)
        if (mat.normalMap) textures.add(mat.normalMap.uuid)
        // ... 其他纹理类型
      })
    }
  })
  return textures.size
})
</script>
```

### 3. MenuItemExtension - 菜单项

在菜单栏中添加新的菜单项。

```typescript
interface MenuItemExtension {
  id: string                            // 菜单项唯一标识
  label: string                         // 显示文本
  path: string[]                        // 菜单路径，如 ['文件', '导出']
  icon?: Component                      // 图标
  shortcut?: string                     // 快捷键显示文本
  action: (context: EngineContext) => void  // 点击动作
  disabled?: boolean | ((context: EngineContext) => boolean)
  visible?: boolean | ((context: EngineContext) => boolean)
  divider?: boolean                     // 在此项前添加分隔线
  order?: number                        // 排序权重
}
```

**示例：添加导出功能菜单**

```typescript
const exportGLTFMenuItem: MenuItemExtension = {
  id: 'export-gltf',
  label: '导出为 GLTF',
  path: ['文件', '导出'],
  shortcut: 'Ctrl+Shift+E',
  action: async (context) => {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter')
    const exporter = new GLTFExporter()
    
    exporter.parse(
      context.three.scene!,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'scene.gltf'
        a.click()
        URL.revokeObjectURL(url)
        
        context.utils.notify({
          type: 'success',
          title: '导出成功',
          content: '场景已导出为 GLTF 格式'
        })
      },
      (error) => {
        context.utils.notify({
          type: 'error',
          title: '导出失败',
          content: error.message
        })
      },
      { binary: false }
    )
  },
  order: 10
}
```

### 4. ShortcutExtension - 快捷键

注册全局快捷键。

```typescript
interface ShortcutExtension {
  id: string                            // 快捷键唯一标识
  keys: string                          // 按键组合，如 'ctrl+s', 'shift+d'
  description: string                   // 描述
  action: (context: EngineContext) => void  // 动作
  global?: boolean                      // 是否全局（在输入框中也生效）
  category?: string                     // 所属分类
}
```

**示例：添加快速复制快捷键**

```typescript
const quickDuplicateShortcut: ShortcutExtension = {
  id: 'quick-duplicate',
  keys: 'shift+d',
  description: '快速复制选中对象',
  category: '编辑',
  action: (context) => {
    const selectedId = context.stores.scene.selectedId
    if (selectedId) {
      context.stores.scene.duplicateObject(selectedId)
      context.utils.notify({
        type: 'info',
        title: '已复制',
        content: '对象已复制到相同位置'
      })
    }
  }
}
```

### 5. ToolbarItemExtension - 工具栏按钮

在工具栏中添加按钮。

```typescript
interface ToolbarItemExtension {
  id: string                            // 工具栏项唯一标识
  label: string                         // 显示文本
  icon: Component                       // 图标（必需）
  tooltip?: string                      // 悬停提示
  action: (context: EngineContext) => void  // 点击动作
  active?: boolean | ((context: EngineContext) => boolean)  // 是否激活
  disabled?: boolean | ((context: EngineContext) => boolean)
  group?: string                        // 分组名称
  order?: number                        // 排序权重
}
```

---

## 生命周期钩子

生命周期钩子让插件能够响应引擎的各种事件。

```typescript
interface PluginHooks {
  // 引擎初始化
  onEngineReady?: (context: EngineContext) => void
  
  // 场景操作
  onSceneLoad?: (scene: SceneObjectData[], context: EngineContext) => void
  onSceneSave?: (scene: SceneObjectData[], context: EngineContext) => SceneObjectData[]
  
  // 对象操作
  onObjectCreate?: (data: SceneObjectData, context: EngineContext) => SceneObjectData | null
  onObjectCreated?: (data: SceneObjectData, threeObject: Object3D, context: EngineContext) => void
  onObjectSelect?: (id: string | null, context: EngineContext) => void
  onObjectDelete?: (id: string, context: EngineContext) => boolean  // 返回 false 可阻止删除
  onObjectUpdate?: (id: string, patch: Partial<SceneObjectData>, context: EngineContext) => void
  
  // 渲染循环
  onBeforeRender?: (delta: number, context: EngineContext) => void
  onAfterRender?: (delta: number, context: EngineContext) => void
  
  // 其他
  onResize?: (width: number, height: number, context: EngineContext) => void
  onUndo?: (context: EngineContext) => void
  onRedo?: (context: EngineContext) => void
}
```

### 钩子使用示例

```typescript
export const analyticsPlugin = definePlugin({
  id: 'analytics',
  name: '分析插件',
  version: '1.0.0',
  
  hooks: {
    // 场景加载后初始化分析
    onSceneLoad(scene, context) {
      console.log(`场景加载完成，共 ${scene.length} 个对象`)
      this.analyzeScene(scene)
    },
    
    // 保存前添加元数据
    onSceneSave(scene, context) {
      return scene.map(obj => ({
        ...obj,
        _metadata: {
          lastModified: Date.now(),
          savedBy: 'analytics-plugin'
        }
      }))
    },
    
    // 拦截对象创建
    onObjectCreate(data, context) {
      // 自动添加前缀
      if (!data.name?.startsWith('[NEW] ')) {
        data.name = `[NEW] ${data.name || '未命名'}`
      }
      return data
    },
    
    // 阻止删除受保护的对象
    onObjectDelete(id, context) {
      const obj = context.stores.scene.getObjectById(id)
      if (obj?.name?.startsWith('[PROTECTED]')) {
        context.utils.notify({
          type: 'warning',
          title: '无法删除',
          content: '此对象受保护，无法删除'
        })
        return false // 阻止删除
      }
      return true
    },
    
    // 每帧更新（用于动画、物理等）
    onBeforeRender(delta, context) {
      // 更新自定义动画
      this.updateAnimations(delta)
    }
  },
  
  install(context) {
    // 初始化
  },
  
  // 插件内部方法
  analyzeScene(scene: SceneObjectData[]) {
    // 分析逻辑
  },
  
  updateAnimations(delta: number) {
    // 动画更新逻辑
  }
})
```

---

## 引擎上下文 API

### stores - Pinia 状态管理

```typescript
context.stores.scene     // 场景 Store
context.stores.animation // 动画 Store

// 常用操作
context.stores.scene.addObject(data)          // 添加对象
context.stores.scene.removeObject(id)         // 删除对象
context.stores.scene.updateObject(id, patch)  // 更新对象
context.stores.scene.selectObject(id)         // 选中对象
context.stores.scene.getObjectById(id)        // 获取对象
```

### three - Three.js 实例

```typescript
context.three.scene     // THREE.Scene 实例
context.three.camera    // THREE.Camera 实例
context.three.renderer  // THREE.WebGLRenderer 实例

// 示例：遍历场景
context.three.scene?.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    // 处理网格
  }
})
```

### 注册函数

```typescript
// 动态注册
context.registerObjectType(extension)
context.registerPanel(extension)
context.registerMenuItem(extension)
context.registerShortcut(extension)
context.registerToolbarItem(extension)

// 动态注销
context.unregisterObjectType(type)
context.unregisterPanel(id)
context.unregisterMenuItem(id)
context.unregisterShortcut(id)
context.unregisterToolbarItem(id)
```

### 事件系统

```typescript
// 监听事件
context.on('custom-event', (data) => {
  console.log('收到事件:', data)
})

// 移除监听
context.off('custom-event', handler)

// 触发事件
context.emit('custom-event', { message: 'Hello!' })
```

### 工具函数

```typescript
// 生成唯一 ID
const id = context.utils.generateId('obj')  // 'obj-1642345678901-abc123xyz'

// 显示通知
context.utils.notify({
  type: 'success' | 'warning' | 'error' | 'info',
  title: '标题',
  content: '详细内容'
})

// 显示确认对话框
const confirmed = await context.utils.confirm({
  title: '确认删除',
  content: '确定要删除此对象吗？'
})
if (confirmed) {
  // 执行删除
}
```

---

## 实战示例

### 示例 1：网格辅助工具插件

一个完整的插件示例，添加网格地面辅助工具。

```typescript
// src/plugins/gridHelper.plugin.ts
import * as THREE from 'three'
import { definePlugin, type EngineContext } from '@/core'
import { markRaw, ref } from 'vue'
import GridIcon from './icons/GridIcon.vue'
import GridPanel from './panels/GridPanel.vue'

// 插件状态
const gridVisible = ref(true)
const gridSize = ref(20)
const gridDivisions = ref(20)
let gridHelper: THREE.GridHelper | null = null

function createGrid(context: EngineContext) {
  if (gridHelper) {
    context.three.scene?.remove(gridHelper)
    gridHelper.dispose()
  }
  
  gridHelper = new THREE.GridHelper(
    gridSize.value,
    gridDivisions.value,
    0x444444,
    0x888888
  )
  gridHelper.visible = gridVisible.value
  context.three.scene?.add(gridHelper)
}

export const gridHelperPlugin = definePlugin({
  id: 'grid-helper',
  name: '网格辅助工具',
  version: '1.0.0',
  description: '在场景中显示可配置的网格地面',
  author: '3DWG Team',
  
  // 面板扩展
  panels: [{
    id: 'grid-settings',
    name: '网格设置',
    icon: markRaw(GridIcon),
    position: 'right',
    component: markRaw(GridPanel),
    defaultVisible: false,
    defaultSize: 200,
    order: 50
  }],
  
  // 工具栏按钮
  toolbarItems: [{
    id: 'toggle-grid',
    label: '切换网格',
    icon: markRaw(GridIcon),
    tooltip: '显示/隐藏网格辅助线',
    action: (context) => {
      gridVisible.value = !gridVisible.value
      if (gridHelper) {
        gridHelper.visible = gridVisible.value
      }
    },
    active: () => gridVisible.value,
    group: 'view',
    order: 10
  }],
  
  // 快捷键
  shortcuts: [{
    id: 'toggle-grid-shortcut',
    keys: 'g',
    description: '切换网格显示',
    category: '视图',
    action: (context) => {
      gridVisible.value = !gridVisible.value
      if (gridHelper) {
        gridHelper.visible = gridVisible.value
      }
    }
  }],
  
  // 菜单项
  menuItems: [{
    id: 'view-grid',
    label: '网格',
    path: ['视图', '辅助显示'],
    shortcut: 'G',
    action: (context) => {
      gridVisible.value = !gridVisible.value
      if (gridHelper) {
        gridHelper.visible = gridVisible.value
      }
    },
    order: 10
  }],
  
  hooks: {
    onEngineReady(context) {
      createGrid(context)
    },
    
    onSceneLoad(scene, context) {
      // 场景加载后重新创建网格
      createGrid(context)
    }
  },
  
  install(context) {
    // 导出配置供面板使用
    ;(window as any).__gridHelperConfig = {
      gridVisible,
      gridSize,
      gridDivisions,
      updateGrid: () => createGrid(context)
    }
  },
  
  uninstall() {
    if (gridHelper) {
      gridHelper.dispose()
      gridHelper = null
    }
    delete (window as any).__gridHelperConfig
  }
})
```

### 示例 2：自动保存插件

```typescript
// src/plugins/autoSave.plugin.ts
import { definePlugin } from '@/core'
import { ref } from 'vue'

const autoSaveInterval = ref(60000) // 默认1分钟
let intervalId: number | null = null

export const autoSavePlugin = definePlugin({
  id: 'auto-save',
  name: '自动保存',
  version: '1.0.0',
  description: '定期自动保存场景到本地存储',
  
  menuItems: [{
    id: 'toggle-autosave',
    label: '自动保存',
    path: ['编辑', '首选项'],
    action: (context) => {
      // 打开设置对话框
    }
  }],
  
  hooks: {
    onEngineReady(context) {
      // 启动自动保存
      this.startAutoSave(context)
    },
    
    onSceneLoad(scene, context) {
      // 场景加载后重置计时器
      this.restartAutoSave(context)
    }
  },
  
  install(context) {
    this.context = context
  },
  
  uninstall() {
    this.stopAutoSave()
  },
  
  // 内部方法
  context: null as any,
  
  startAutoSave(context: any) {
    this.stopAutoSave()
    intervalId = window.setInterval(() => {
      this.saveToLocalStorage(context)
    }, autoSaveInterval.value)
  },
  
  restartAutoSave(context: any) {
    this.startAutoSave(context)
  },
  
  stopAutoSave() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  },
  
  saveToLocalStorage(context: any) {
    try {
      const scene = context.stores.scene.scene
      const data = JSON.stringify(scene)
      localStorage.setItem('3dwg-autosave', data)
      localStorage.setItem('3dwg-autosave-time', Date.now().toString())
      console.log('[AutoSave] 场景已自动保存')
    } catch (error) {
      console.error('[AutoSave] 保存失败:', error)
    }
  }
})
```

### 示例 3：物理引擎插件（高级）

```typescript
// src/plugins/physics.plugin.ts
import { definePlugin, type ObjectTypeExtension } from '@/core'
import * as THREE from 'three'
import { markRaw } from 'vue'
import PhysicsPanel from './panels/PhysicsPanel.vue'

// 假设使用 Cannon.js 或 Rapier
// import * as CANNON from 'cannon-es'

export const physicsPlugin = definePlugin({
  id: 'physics',
  name: '物理引擎',
  version: '1.0.0',
  description: '为场景对象添加物理模拟支持',
  
  // 扩展对象数据结构
  objectTypes: [{
    type: 'rigidBody',
    label: '刚体',
    category: 'custom',
    
    defaultData: () => ({
      type: 'mesh',
      name: '刚体',
      physics: {
        mass: 1,
        friction: 0.5,
        restitution: 0.3,
        shape: 'box'
      }
    }),
    
    createThreeObject(data, context) {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshStandardMaterial({ color: '#ff6b6b' })
      return new THREE.Mesh(geometry, material)
    },
    
    selectable: true,
    supportedOperations: ['translate', 'rotate', 'scale', 'delete', 'duplicate']
  }],
  
  panels: [{
    id: 'physics-panel',
    name: '物理属性',
    position: 'right',
    component: markRaw(PhysicsPanel),
    defaultVisible: false,
    order: 60
  }],
  
  hooks: {
    onEngineReady(context) {
      this.initPhysicsWorld()
    },
    
    onBeforeRender(delta, context) {
      // 更新物理模拟
      this.stepPhysics(delta)
      this.syncPhysicsToThree(context)
    },
    
    onObjectCreated(data, threeObject, context) {
      if (data.physics) {
        this.addPhysicsBody(data, threeObject)
      }
    },
    
    onObjectDelete(id, context) {
      this.removePhysicsBody(id)
      return true
    }
  },
  
  // 内部状态和方法
  physicsWorld: null as any,
  physicsBodies: new Map(),
  
  install(context) {
    // 初始化
  },
  
  uninstall() {
    this.physicsWorld = null
    this.physicsBodies.clear()
  },
  
  initPhysicsWorld() {
    // 初始化物理世界
    // this.physicsWorld = new CANNON.World()
    // this.physicsWorld.gravity.set(0, -9.82, 0)
  },
  
  stepPhysics(delta: number) {
    // this.physicsWorld?.step(1/60, delta, 3)
  },
  
  syncPhysicsToThree(context: any) {
    // 同步物理位置到 Three.js 对象
  },
  
  addPhysicsBody(data: any, threeObject: THREE.Object3D) {
    // 为 Three.js 对象创建物理刚体
  },
  
  removePhysicsBody(id: string) {
    // 移除物理刚体
  }
})
```

---

## 最佳实践

### 1. 插件命名规范

- **ID**: 使用 `kebab-case`，如 `my-awesome-plugin`
- **版本**: 遵循 [Semantic Versioning](https://semver.org/)
- **文件**: `{pluginName}.plugin.ts`

### 2. 避免全局污染

```typescript
// ❌ 不好的做法
window.myPluginState = { ... }

// ✅ 好的做法
const pluginState = ref({ ... })  // 使用闭包或 Vue 响应式
```

### 3. 清理资源

```typescript
export const myPlugin = definePlugin({
  // ...
  
  uninstall() {
    // 清理事件监听
    this.removeEventListeners()
    
    // 清理 Three.js 资源
    this.disposeGeometries()
    this.disposeMaterials()
    this.disposeTextures()
    
    // 清理定时器
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
})
```

### 4. 使用 TypeScript

```typescript
// 利用 definePlugin 获得完整的类型提示
import { definePlugin, type EngineContext, type ObjectTypeExtension } from '@/core'

const myExtension: ObjectTypeExtension = {
  // TypeScript 会检查所有必需属性
}
```

### 5. 处理依赖

```typescript
export const advancedPlugin = definePlugin({
  id: 'advanced-plugin',
  name: '高级插件',
  version: '1.0.0',
  
  // 声明依赖
  dependencies: ['basic-plugin', 'utils-plugin'],
  
  install(context) {
    // 安装时会自动检查依赖是否已安装
  }
})
```

### 6. 提供配置选项

```typescript
// 使用工厂函数创建可配置的插件
export function createMyPlugin(options: MyPluginOptions = {}) {
  const config = {
    enableFeatureA: true,
    enableFeatureB: false,
    ...options
  }
  
  return definePlugin({
    id: 'my-plugin',
    name: '我的插件',
    version: '1.0.0',
    
    install(context) {
      if (config.enableFeatureA) {
        // 启用功能 A
      }
      if (config.enableFeatureB) {
        // 启用功能 B
      }
    }
  })
}

// 使用
await pluginManager.register(createMyPlugin({
  enableFeatureA: true,
  enableFeatureB: true
}))
```

---

## 高级主题

### 插件间通信

```typescript
// 插件 A - 发送消息
export const pluginA = definePlugin({
  id: 'plugin-a',
  // ...
  install(context) {
    // 通过事件系统与其他插件通信
    context.on('plugin-b:ready', () => {
      console.log('Plugin B 已就绪')
    })
    
    // 发送事件
    context.emit('plugin-a:initialized', { timestamp: Date.now() })
  }
})

// 插件 B - 接收消息
export const pluginB = definePlugin({
  id: 'plugin-b',
  // ...
  install(context) {
    context.on('plugin-a:initialized', (data) => {
      console.log('Plugin A 初始化于:', data.timestamp)
    })
    
    // 通知其他插件自己已就绪
    context.emit('plugin-b:ready')
  }
})
```

### 异步安装

```typescript
export const asyncPlugin = definePlugin({
  id: 'async-plugin',
  // ...
  
  async install(context) {
    // 异步加载资源
    const models = await this.loadModels()
    const textures = await this.loadTextures()
    
    // 初始化
    this.initializeWithAssets(models, textures)
  },
  
  async loadModels() {
    // 加载 3D 模型
  },
  
  async loadTextures() {
    // 加载纹理
  }
})
```

### 条件扩展注册

```typescript
export const conditionalPlugin = definePlugin({
  id: 'conditional-plugin',
  // ...
  
  install(context) {
    // 根据条件动态注册扩展
    if (this.isFeatureSupported()) {
      context.registerPanel({
        id: 'advanced-panel',
        // ...
      })
    }
    
    // 监听事件动态注册
    context.on('user:premium-enabled', () => {
      context.registerMenuItem({
        id: 'premium-feature',
        // ...
      })
    })
  }
})
```

### 插件热重载（开发模式）

```typescript
// 在开发环境中支持热重载
if (import.meta.hot) {
  import.meta.hot.accept('./myPlugin', (newModule) => {
    // 卸载旧插件
    pluginManager.unregister('my-plugin')
    
    // 注册新插件
    pluginManager.register(newModule.myPlugin)
  })
}
```

---

## 总结

ThreeJS-Editor 的插件系统提供了强大而灵活的扩展能力：

| 扩展类型 | 用途 | 典型场景 |
|---------|------|---------|
| ObjectType | 自定义 3D 对象 | 样条曲线、地形、粒子系统 |
| Panel | 自定义面板 | 属性编辑器、资源浏览器 |
| MenuItem | 菜单项 | 导入/导出、工具功能 |
| Shortcut | 快捷键 | 快速操作、效率工具 |
| ToolbarItem | 工具栏按钮 | 模式切换、快捷功能 |

通过生命周期钩子，插件可以深度集成到引擎的各个环节，实现从简单的 UI 扩展到复杂的功能增强。

如有问题，欢迎在项目 Issues 中提出！
