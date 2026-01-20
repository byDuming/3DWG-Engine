<script setup lang="ts">
/**
 * 时间轴轨道组件
 */

import { ref, computed } from 'vue'
import type { AnimationTrack, Keyframe, EasingType } from '@/types/animation'
import { useAnimationStore } from '@/stores/modules/useAnimation.store'
import { NDropdown, NTooltip } from 'naive-ui'
import EasingPicker from './EasingPicker.vue'

// 缓动函数分组配置
const easingCategories = [
  {
    label: '基础',
    key: 'basic',
    children: [
      { label: '线性', key: 'linear' }
    ]
  },
  {
    label: '二次方',
    key: 'quad',
    children: [
      { label: '缓入', key: 'easeInQuad' },
      { label: '缓出', key: 'easeOutQuad' },
      { label: '缓入缓出', key: 'easeInOutQuad' }
    ]
  },
  {
    label: '三次方',
    key: 'cubic',
    children: [
      { label: '缓入', key: 'easeInCubic' },
      { label: '缓出', key: 'easeOutCubic' },
      { label: '缓入缓出', key: 'easeInOutCubic' }
    ]
  },
  {
    label: '四次方',
    key: 'quart',
    children: [
      { label: '缓入', key: 'easeInQuart' },
      { label: '缓出', key: 'easeOutQuart' },
      { label: '缓入缓出', key: 'easeInOutQuart' }
    ]
  },
  {
    label: '五次方',
    key: 'quint',
    children: [
      { label: '缓入', key: 'easeInQuint' },
      { label: '缓出', key: 'easeOutQuint' },
      { label: '缓入缓出', key: 'easeInOutQuint' }
    ]
  },
  {
    label: '正弦',
    key: 'sine',
    children: [
      { label: '缓入', key: 'easeInSine' },
      { label: '缓出', key: 'easeOutSine' },
      { label: '缓入缓出', key: 'easeInOutSine' }
    ]
  },
  {
    label: '指数',
    key: 'expo',
    children: [
      { label: '缓入', key: 'easeInExpo' },
      { label: '缓出', key: 'easeOutExpo' },
      { label: '缓入缓出', key: 'easeInOutExpo' }
    ]
  },
  {
    label: '圆形',
    key: 'circ',
    children: [
      { label: '缓入', key: 'easeInCirc' },
      { label: '缓出', key: 'easeOutCirc' },
      { label: '缓入缓出', key: 'easeInOutCirc' }
    ]
  },
  {
    label: '回弹',
    key: 'back',
    children: [
      { label: '缓入', key: 'easeInBack' },
      { label: '缓出', key: 'easeOutBack' },
      { label: '缓入缓出', key: 'easeInOutBack' }
    ]
  },
  {
    label: '弹性',
    key: 'elastic',
    children: [
      { label: '缓入', key: 'easeInElastic' },
      { label: '缓出', key: 'easeOutElastic' },
      { label: '缓入缓出', key: 'easeInOutElastic' }
    ]
  },
  {
    label: '弹跳',
    key: 'bounce',
    children: [
      { label: '缓入', key: 'easeInBounce' },
      { label: '缓出', key: 'easeOutBounce' },
      { label: '缓入缓出', key: 'easeInOutBounce' }
    ]
  }
]

const props = defineProps<{
  track: AnimationTrack
  trackColor?: string
  pixelsPerSecond: number
  duration: number
}>()

const emit = defineEmits<{
  (e: 'keyframe-click', keyframe: Keyframe): void
  (e: 'keyframe-move', keyframeId: string, newTime: number): void
}>()

const animationStore = useAnimationStore()

// 拖拽状态
const draggingKeyframeId = ref<string | null>(null)
const dragStartX = ref(0)
const dragStartTime = ref(0)

// 右键菜单状态
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuKeyframe = ref<Keyframe | null>(null)

// 获取当前关键帧的缓动类型标签
function getEasingLabel(easing: EasingType): string {
  const labels: Record<string, string> = {
    linear: '线性',
    easeInQuad: '二次方缓入',
    easeOutQuad: '二次方缓出',
    easeInOutQuad: '二次方缓入缓出',
    easeInCubic: '三次方缓入',
    easeOutCubic: '三次方缓出',
    easeInOutCubic: '三次方缓入缓出',
    easeInQuart: '四次方缓入',
    easeOutQuart: '四次方缓出',
    easeInOutQuart: '四次方缓入缓出',
    easeInQuint: '五次方缓入',
    easeOutQuint: '五次方缓出',
    easeInOutQuint: '五次方缓入缓出',
    easeInSine: '正弦缓入',
    easeOutSine: '正弦缓出',
    easeInOutSine: '正弦缓入缓出',
    easeInExpo: '指数缓入',
    easeOutExpo: '指数缓出',
    easeInOutExpo: '指数缓入缓出',
    easeInCirc: '圆形缓入',
    easeOutCirc: '圆形缓出',
    easeInOutCirc: '圆形缓入缓出',
    easeInBack: '回弹缓入',
    easeOutBack: '回弹缓出',
    easeInOutBack: '回弹缓入缓出',
    easeInElastic: '弹性缓入',
    easeOutElastic: '弹性缓出',
    easeInOutElastic: '弹性缓入缓出',
    easeInBounce: '弹跳缓入',
    easeOutBounce: '弹跳缓出',
    easeInOutBounce: '弹跳缓入缓出'
  }
  return labels[easing] ?? easing
}

// 右键菜单选项
const contextMenuOptions = computed(() => {
  const currentEasing = contextMenuKeyframe.value?.easing ?? 'linear'
  
  return [
    {
      label: `缓动函数 (${getEasingLabel(currentEasing)})`,
      key: 'easing',
      icon: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', { d: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z' })
      ]),
      children: easingCategories.map(cat => ({
        label: cat.label,
        key: `cat-${cat.key}`,
        children: cat.children.map(item => ({
          label: item.label,
          key: item.key,
          props: {
            style: currentEasing === item.key ? 'color: #18a058; font-weight: 500;' : ''
          }
        }))
      }))
    },
    { type: 'divider', key: 'd0' },
    {
      label: '删除关键帧',
      key: 'delete',
      icon: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', { d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' })
      ])
    },
    {
      label: '复制关键帧',
      key: 'copy',
      icon: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor' }, [
        h('path', { d: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z' })
      ])
    },
    { type: 'divider', key: 'd1' },
    {
      label: '跳转到此帧',
      key: 'goto'
    }
  ]
})

import { h } from 'vue'

// 处理右键菜单
function handleContextMenu(event: MouseEvent, keyframe: Keyframe) {
  event.preventDefault()
  event.stopPropagation()
  
  // 如果右键的关键帧未选中，先选中它
  if (!animationStore.timelineSelection.keyframeIds.includes(keyframe.id)) {
    animationStore.selectKeyframes([keyframe.id])
  }
  
  contextMenuKeyframe.value = keyframe
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

// 处理右键菜单选择
function handleContextMenuSelect(key: string) {
  showContextMenu.value = false
  
  if (!contextMenuKeyframe.value) return
  
  // 检查是否是缓动函数选择
  const easingKeys = [
    'linear',
    'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
    'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
    'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
    'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
    'easeInSine', 'easeOutSine', 'easeInOutSine',
    'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
    'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
    'easeInBack', 'easeOutBack', 'easeInOutBack',
    'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
    'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
  ]
  
  if (easingKeys.includes(key)) {
    // 更新选中关键帧的缓动函数
    const selectedIds = animationStore.timelineSelection.keyframeIds
    if (selectedIds.length > 0) {
      // 批量更新所有选中的关键帧
      for (const kfId of selectedIds) {
        animationStore.updateKeyframe(props.track.id, kfId, { easing: key as EasingType })
      }
    } else {
      // 只更新当前右键的关键帧
      animationStore.updateKeyframe(props.track.id, contextMenuKeyframe.value.id, { easing: key as EasingType })
    }
    return
  }
  
  switch (key) {
    case 'delete':
      animationStore.deleteSelectedKeyframes()
      break
    case 'copy':
      // TODO: 实现复制功能
      console.log('复制关键帧:', contextMenuKeyframe.value)
      break
    case 'goto':
      animationStore.seek(contextMenuKeyframe.value.time)
      break
  }
}

// 关闭右键菜单
function handleClickOutside() {
  showContextMenu.value = false
}

// 关键帧位置计算
function getKeyframeX(keyframe: Keyframe): number {
  return keyframe.time * props.pixelsPerSecond
}

// 处理关键帧点击
function handleKeyframeClick(event: MouseEvent, keyframe: Keyframe) {
  event.stopPropagation()
  
  if (event.shiftKey) {
    // Shift+点击：添加到选择
    const currentIds = animationStore.timelineSelection.keyframeIds
    if (currentIds.includes(keyframe.id)) {
      // 已选中，取消选择
      animationStore.selectKeyframes(currentIds.filter(id => id !== keyframe.id))
    } else {
      animationStore.selectKeyframes([...currentIds, keyframe.id])
    }
  } else {
    // 普通点击：单选
    emit('keyframe-click', keyframe)
  }
}

// 处理关键帧拖拽开始
function handleKeyframeDragStart(event: MouseEvent, keyframe: Keyframe) {
  event.stopPropagation()
  
  if (props.track.locked) return
  
  draggingKeyframeId.value = keyframe.id
  dragStartX.value = event.clientX
  dragStartTime.value = keyframe.time
  
  document.addEventListener('mousemove', handleKeyframeDrag)
  document.addEventListener('mouseup', handleKeyframeDragEnd)
}

// 处理关键帧拖拽
function handleKeyframeDrag(event: MouseEvent) {
  if (!draggingKeyframeId.value) return
  
  const deltaX = event.clientX - dragStartX.value
  const deltaTime = deltaX / props.pixelsPerSecond
  let newTime = dragStartTime.value + deltaTime
  
  // 限制范围
  newTime = Math.max(0, Math.min(props.duration, newTime))
  
  // 吸附到帧
  if (animationStore.timelineView.snapToFrames && animationStore.activeClip) {
    const fps = animationStore.activeClip.fps
    newTime = Math.round(newTime * fps) / fps
  }
  
  // 实时更新位置（临时）
  const keyframe = props.track.keyframes.find(k => k.id === draggingKeyframeId.value)
  if (keyframe) {
    keyframe.time = newTime
  }
}

// 处理关键帧拖拽结束
function handleKeyframeDragEnd(_event: MouseEvent) {
  if (!draggingKeyframeId.value) return
  
  const keyframe = props.track.keyframes.find(k => k.id === draggingKeyframeId.value)
  if (keyframe) {
    emit('keyframe-move', draggingKeyframeId.value, keyframe.time)
  }
  
  draggingKeyframeId.value = null
  document.removeEventListener('mousemove', handleKeyframeDrag)
  document.removeEventListener('mouseup', handleKeyframeDragEnd)
}

// 缓动选择器弹窗状态
const showEasingPicker = ref(false)
const editingKeyframe = ref<Keyframe | null>(null)
const editingEasing = ref<EasingType>('linear')

// 处理双击（打开缓动选择器）
function handleKeyframeDblClick(event: MouseEvent, keyframe: Keyframe) {
  event.stopPropagation()
  
  if (props.track.locked) return
  
  editingKeyframe.value = keyframe
  editingEasing.value = keyframe.easing
  showEasingPicker.value = true
}

// 确认缓动选择
function handleEasingConfirm(easing: EasingType) {
  if (editingKeyframe.value) {
    animationStore.updateKeyframe(props.track.id, editingKeyframe.value.id, { easing })
  }
  showEasingPicker.value = false
  editingKeyframe.value = null
}

// 取消缓动选择
function handleEasingCancel() {
  showEasingPicker.value = false
  editingKeyframe.value = null
}

// 判断关键帧是否选中
function isKeyframeSelected(keyframeId: string): boolean {
  return animationStore.timelineSelection.keyframeIds.includes(keyframeId)
}

// 轨道背景颜色（优先使用外部传入的颜色）
const trackColor = computed(() => {
  return props.trackColor ?? props.track.color ?? '#4a90d9'
})
</script>

<template>
  <div 
    class="timeline-track"
    :class="{ 
      disabled: !track.enabled,
      locked: track.locked 
    }"
  >
    <!-- 轨道背景 -->
    <div class="track-background"></div>
    
    <!-- 关键帧连接线 -->
    <svg class="keyframe-connections" :width="duration * pixelsPerSecond" height="24">
      <template v-for="(keyframe, index) in track.keyframes" :key="`line-${keyframe.id}`">
        <line
          v-if="index < track.keyframes.length - 1"
          :x1="getKeyframeX(keyframe)"
          y1="12"
          :x2="getKeyframeX(track.keyframes[index + 1]!)"
          y2="12"
          :stroke="trackColor"
          stroke-width="2"
          :opacity="track.enabled ? 0.6 : 0.3"
        />
      </template>
    </svg>
    
    <!-- 关键帧点 -->
    <n-tooltip
      v-for="keyframe in track.keyframes"
      :key="keyframe.id"
      trigger="hover"
      :delay="500"
      placement="top"
    >
      <template #trigger>
        <div
          class="keyframe"
          :class="{
            selected: isKeyframeSelected(keyframe.id),
            dragging: draggingKeyframeId === keyframe.id
          }"
          :style="{
            left: `${getKeyframeX(keyframe)}px`,
            backgroundColor: trackColor
          }"
          @click="handleKeyframeClick($event, keyframe)"
          @mousedown="handleKeyframeDragStart($event, keyframe)"
          @dblclick="handleKeyframeDblClick($event, keyframe)"
          @contextmenu="handleContextMenu($event, keyframe)"
        >
          <div class="keyframe-diamond"></div>
        </div>
      </template>
      <div class="keyframe-tooltip">
        <div class="tooltip-row">
          <span class="tooltip-label">时间:</span>
          <span class="tooltip-value">{{ keyframe.time.toFixed(2) }}s</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">缓动:</span>
          <span class="tooltip-value">{{ getEasingLabel(keyframe.easing) }}</span>
        </div>
        <div class="tooltip-hint">双击或右键修改缓动</div>
      </div>
    </n-tooltip>
    
    <!-- 右键上下文菜单 -->
    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      :show="showContextMenu"
      :on-clickoutside="handleClickOutside"
      @select="handleContextMenuSelect"
    />
    
    <!-- 缓动选择器弹窗 -->
    <Teleport to="body">
      <div 
        v-if="showEasingPicker" 
        class="easing-picker-overlay"
        @click.self="handleEasingCancel"
      >
        <div class="easing-picker-modal">
          <div class="easing-picker-header">
            <span>选择缓动函数</span>
            <button class="close-btn" @click="handleEasingCancel">&times;</button>
          </div>
          <EasingPicker
            v-model="editingEasing"
            @confirm="handleEasingConfirm"
            @cancel="handleEasingCancel"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.timeline-track {
  height: 24px;
  position: relative;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.timeline-track.disabled {
  opacity: 0.5;
}

.timeline-track.locked {
  pointer-events: none;
}

.track-background {
  position: absolute;
  inset: 0;
  background: transparent;
}

.timeline-track:hover .track-background {
  background: rgba(0, 0, 0, 0.03);
}

.keyframe-connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.keyframe {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  margin-top: -7px;
  cursor: pointer;
  z-index: 5;
  transition: filter 0.15s;
}

.keyframe-diamond {
  width: 100%;
  height: 100%;
  transform: rotate(45deg);
  background: inherit;
  border-radius: 2px;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.keyframe:hover .keyframe-diamond {
  transform: rotate(45deg) scale(1.3);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.keyframe.selected {
  z-index: 10;
}

.keyframe.selected .keyframe-diamond {
  transform: rotate(45deg) scale(1.2);
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px #1976d2, 0 0 12px rgba(25, 118, 210, 0.5);
  animation: pulse-selected 1.5s infinite;
}

@keyframes pulse-selected {
  0%, 100% {
    box-shadow: 0 0 0 3px #fff, 0 0 0 5px #1976d2, 0 0 12px rgba(25, 118, 210, 0.5);
  }
  50% {
    box-shadow: 0 0 0 3px #fff, 0 0 0 5px #1976d2, 0 0 18px rgba(25, 118, 210, 0.7);
  }
}

.keyframe.dragging .keyframe-diamond {
  transform: rotate(45deg) scale(1.4);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

/* Tooltip 样式 */
.keyframe-tooltip {
  font-size: 12px;
  line-height: 1.5;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.tooltip-label {
  color: #999;
}

.tooltip-value {
  color: #fff;
  font-weight: 500;
}

.tooltip-hint {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.1);
  color: #888;
  font-size: 11px;
}
</style>

<style>
/* 缓动选择器弹窗（Teleport 到 body，需要全局样式） */
.easing-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.easing-picker-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.easing-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 500;
}

.easing-picker-header .close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}

.easing-picker-header .close-btn:hover {
  background: #f0f0f0;
  color: #333;
}
</style>
