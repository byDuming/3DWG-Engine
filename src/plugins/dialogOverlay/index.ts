import { definePlugin } from '@/core'
import { Vector3 } from 'three'
import { worldToScreen } from './utils/worldToScreen'
import { closeDialog, listDialogs, openDialog, updateDialog } from './store'
import type { DialogOpenOptions, DialogTarget } from './types'
import DialogOverlayPanel from './components/DialogOverlayPanel.vue'
import { ChatboxEllipsesOutline } from '@vicons/ionicons5'

/**
 * DOM 弹窗 Overlay 插件
 *
 * 为 3D 场景提供常驻/跟随的 DOM 弹窗功能
 * 
 * 事件：
 * - dialog:open (options, reply?) -> reply(id)
 * - dialog:close (id)
 * - dialog:update (id, patch)
 * - dialog:list (reply?) -> reply(dialogs)
 */
const dialogOverlayPlugin = definePlugin({
  id: 'dialog-overlay',
  name: '弹窗 Overlay（DOM）',
  version: '0.1.0',
  description: '为 3D 场景提供常驻/跟随的 DOM 弹窗',
  
  // 默认启用此插件
  defaultEnabled: true,
  
  panels: [
    {
      id: 'dialog-overlay-panel',
      name: '弹窗',
      icon: ChatboxEllipsesOutline,
      position: 'left',
      component: DialogOverlayPanel,
      order: 50
    }
  ],

  install(context) {
    // open
    context.on('dialog:open', (options: DialogOpenOptions, reply?: (id: string) => void) => {
      const id = openDialog(options)
      reply?.(id)
    })
    // close
    context.on('dialog:close', (id: string) => closeDialog(id))
    // update
    context.on('dialog:update', (id: string, patch: any) => updateDialog(id, patch))
    // list
    context.on('dialog:list', (reply?: (dialogs: any) => void) => reply?.(listDialogs()))
  },

  hooks: {
    onAfterRender(delta, context) {
      void delta
      const camera = context.three.camera
      const renderer = context.three.renderer as any
      if (!camera || !renderer?.domElement) return

      const rect = renderer.domElement.getBoundingClientRect()
      const tmp = new Vector3()

      for (const d of listDialogs()) {
        if (!d.visible) continue
        if (d.pin) continue
        if (!d.follow) continue

        const target = d.target as DialogTarget
        let world: Vector3 | null = null

        if (target.kind === 'screen') {
          d.screen.x = target.x
          d.screen.y = target.y
          d.screen.z = 0
          d.screen.inFrustum = true
          continue
        }

        if (target.kind === 'world') {
          const [x, y, z] = target.position
          world = tmp.set(x, y, z)
        }

        if (target.kind === 'object') {
          const obj = context.stores.scene.objectsMap.get(target.objectId)
          if (!obj) {
            d.screen.inFrustum = false
            continue
          }
          obj.getWorldPosition(tmp)
          world = tmp
        }

        if (!world) continue
        const res = worldToScreen(world, camera, rect)
        d.screen.x = res.x
        d.screen.y = res.y
        d.screen.z = res.z
        d.screen.inFrustum = res.inFrustum
      }
    }
  }
})

// 默认导出插件（用于自动发现）
export default dialogOverlayPlugin

// 命名导出（保持向后兼容）
export { dialogOverlayPlugin }

// 导出组件（供外部使用）
export { default as DialogOverlayHost } from './components/DialogOverlayHost.vue'
export { default as DialogOverlayPanel } from './components/DialogOverlayPanel.vue'
export { default as DialogTextContent } from './components/DialogTextContent.vue'

// 导出类型和工具函数
export * from './types'
export * from './store'
export { worldToScreen } from './utils/worldToScreen'
