<script setup lang="ts">
/**
 * 缓动函数选择器组件
 * 
 * 功能：
 * - 分类显示所有缓动函数
 * - 实时曲线预览
 * - 动画效果预览
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NButton } from 'naive-ui'
import type { EasingType } from '@/types/animation'

const props = defineProps<{
  modelValue: EasingType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: EasingType): void
  (e: 'confirm', value: EasingType): void
  (e: 'cancel'): void
}>()

// 缓动函数实现（用于绘制曲线）
const easingFunctions: Record<string, (t: number) => number> = {
  linear: t => t,
  // Quad
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // Cubic
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // Quart
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - (--t) * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  // Quint
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  // Sine
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  // Expo
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0
    if (t === 1) return 1
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
    return (2 - Math.pow(2, -20 * t + 10)) / 2
  },
  // Circ
  easeInCirc: t => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: t => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: t => t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  // Back
  easeInBack: t => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
  easeOutBack: t => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  easeInOutBack: t => {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  },
  // Elastic
  easeInElastic: t => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  },
  easeOutElastic: t => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  easeInOutElastic: t => {
    const c5 = (2 * Math.PI) / 4.5
    return t === 0 ? 0 : t === 1 ? 1
      : t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  },
  // Bounce
  easeOutBounce: t => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  easeInBounce: t => 1 - easingFunctions.easeOutBounce!(1 - t),
  easeInOutBounce: t => t < 0.5
    ? (1 - easingFunctions.easeOutBounce!(1 - 2 * t)) / 2
    : (1 + easingFunctions.easeOutBounce!(2 * t - 1)) / 2,
}

// 缓动分类配置
const easingCategories = [
  {
    name: '基础',
    items: [
      { key: 'linear', label: '线性' }
    ]
  },
  {
    name: '二次方',
    items: [
      { key: 'easeInQuad', label: '缓入' },
      { key: 'easeOutQuad', label: '缓出' },
      { key: 'easeInOutQuad', label: '缓入缓出' }
    ]
  },
  {
    name: '三次方',
    items: [
      { key: 'easeInCubic', label: '缓入' },
      { key: 'easeOutCubic', label: '缓出' },
      { key: 'easeInOutCubic', label: '缓入缓出' }
    ]
  },
  {
    name: '四次方',
    items: [
      { key: 'easeInQuart', label: '缓入' },
      { key: 'easeOutQuart', label: '缓出' },
      { key: 'easeInOutQuart', label: '缓入缓出' }
    ]
  },
  {
    name: '五次方',
    items: [
      { key: 'easeInQuint', label: '缓入' },
      { key: 'easeOutQuint', label: '缓出' },
      { key: 'easeInOutQuint', label: '缓入缓出' }
    ]
  },
  {
    name: '正弦',
    items: [
      { key: 'easeInSine', label: '缓入' },
      { key: 'easeOutSine', label: '缓出' },
      { key: 'easeInOutSine', label: '缓入缓出' }
    ]
  },
  {
    name: '指数',
    items: [
      { key: 'easeInExpo', label: '缓入' },
      { key: 'easeOutExpo', label: '缓出' },
      { key: 'easeInOutExpo', label: '缓入缓出' }
    ]
  },
  {
    name: '圆形',
    items: [
      { key: 'easeInCirc', label: '缓入' },
      { key: 'easeOutCirc', label: '缓出' },
      { key: 'easeInOutCirc', label: '缓入缓出' }
    ]
  },
  {
    name: '回弹',
    items: [
      { key: 'easeInBack', label: '缓入' },
      { key: 'easeOutBack', label: '缓出' },
      { key: 'easeInOutBack', label: '缓入缓出' }
    ]
  },
  {
    name: '弹性',
    items: [
      { key: 'easeInElastic', label: '缓入' },
      { key: 'easeOutElastic', label: '缓出' },
      { key: 'easeInOutElastic', label: '缓入缓出' }
    ]
  },
  {
    name: '弹跳',
    items: [
      { key: 'easeInBounce', label: '缓入' },
      { key: 'easeOutBounce', label: '缓出' },
      { key: 'easeInOutBounce', label: '缓入缓出' }
    ]
  }
]

// 当前选中的缓动
const selectedEasing = ref<EasingType>(props.modelValue)

// 预览动画状态
const previewProgress = ref(0)
let animationFrame: number | null = null
let animationStartTime = 0

// 生成曲线 SVG 路径
function generateCurvePath(easing: string, width: number, height: number, padding = 4): string {
  const fn = easingFunctions[easing]
  if (!fn) return ''
  
  const points: string[] = []
  const steps = 50
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = padding + t * (width - padding * 2)
    const y = height - padding - fn(t) * (height - padding * 2)
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
  }
  
  return points.join(' ')
}

// 小预览曲线
function getSmallCurvePath(easing: string): string {
  return generateCurvePath(easing, 40, 30, 3)
}

// 大预览曲线
const largeCurvePath = computed(() => {
  return generateCurvePath(selectedEasing.value, 200, 150, 10)
})

// 预览小球位置
const previewBallPosition = computed(() => {
  const fn = easingFunctions[selectedEasing.value]
  if (!fn) return { x: 10, y: 140 }
  
  const t = previewProgress.value
  const x = 10 + t * 180
  const y = 140 - fn(t) * 130
  
  return { x, y }
})

// 选择缓动
function selectEasing(easing: string) {
  console.log('选择缓动:', easing)
  selectedEasing.value = easing as EasingType
  emit('update:modelValue', easing as EasingType)
  restartPreviewAnimation()
}

// 确认选择
function confirmSelection() {
  emit('confirm', selectedEasing.value)
}

// 取消选择
function cancelSelection() {
  emit('cancel')
}

// 预览动画
function startPreviewAnimation() {
  animationStartTime = performance.now()
  
  function animate(currentTime: number) {
    const elapsed = currentTime - animationStartTime
    const duration = 1500 // 1.5秒循环
    previewProgress.value = (elapsed % duration) / duration
    animationFrame = requestAnimationFrame(animate)
  }
  
  animationFrame = requestAnimationFrame(animate)
}

function stopPreviewAnimation() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

function restartPreviewAnimation() {
  stopPreviewAnimation()
  previewProgress.value = 0
  startPreviewAnimation()
}

// 生命周期
onMounted(() => {
  startPreviewAnimation()
})

onUnmounted(() => {
  stopPreviewAnimation()
})

watch(() => props.modelValue, (newVal) => {
  selectedEasing.value = newVal
})
</script>

<template>
  <div class="easing-picker" @click.stop>
    <!-- 左侧：缓动列表 -->
    <div class="easing-list">
      <div
        v-for="category in easingCategories"
        :key="category.name"
        class="easing-category"
      >
        <div class="category-name">{{ category.name }}</div>
        <div class="category-items">
          <div
            v-for="item in category.items"
            :key="item.key"
            class="easing-item"
            :class="{ selected: selectedEasing === item.key }"
            @click="selectEasing(item.key)"
          >
            <svg class="curve-preview" width="40" height="30" viewBox="0 0 40 30">
              <path
                :d="getSmallCurvePath(item.key)"
                fill="none"
                :stroke="selectedEasing === item.key ? '#18a058' : '#666'"
                stroke-width="2"
              />
            </svg>
            <span class="item-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧：大预览 -->
    <div class="preview-panel">
      <div class="preview-title">预览</div>
      
      <!-- 曲线预览 -->
      <div class="curve-preview-large">
        <svg width="200" height="150" viewBox="0 0 200 150">
          <!-- 网格 -->
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eee" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="200" height="150" fill="url(#grid)" />
          
          <!-- 对角线（线性参考） -->
          <line x1="10" y1="140" x2="190" y2="10" stroke="#ddd" stroke-width="1" stroke-dasharray="4,4" />
          
          <!-- 曲线 -->
          <path
            :d="largeCurvePath"
            fill="none"
            stroke="#18a058"
            stroke-width="3"
          />
          
          <!-- 动画小球 -->
          <circle
            :cx="previewBallPosition.x"
            :cy="previewBallPosition.y"
            r="6"
            fill="#18a058"
          />
        </svg>
      </div>
      
      <!-- 动画条预览 -->
      <div class="animation-preview">
        <div class="animation-label">动画效果</div>
        <div class="animation-track">
          <div 
            class="animation-ball"
            :style="{ 
              left: `${previewProgress * 100}%`,
              transform: `translateX(-50%) translateY(${-(easingFunctions[selectedEasing]?.(previewProgress) ?? 0) * 20}px)`
            }"
          ></div>
        </div>
      </div>
      
      <!-- 按钮 -->
      <div class="preview-actions">
        <n-button size="small" @click="cancelSelection">取消</n-button>
        <n-button size="small" type="primary" @click="confirmSelection">确定</n-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.easing-picker {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  position: relative;
  z-index: 1;
}

.easing-list {
  width: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.easing-category {
  border: 1px solid #eee;
  border-radius: 6px;
  /* overflow: hidden; */
}

.category-name {
  padding: 6px 10px;
  background: #f5f5f5;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.category-items {
  display: flex;
  flex-wrap: wrap;
  padding: 6px;
  gap: 4px;
}

.easing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  border: 2px solid transparent;
  user-select: none;
  position: relative;
  z-index: 2;
}

.easing-item:hover {
  background: #f0f0f0;
}

.easing-item.selected {
  background: #e8f5e9;
  border-color: #18a058;
}

.curve-preview {
  display: block;
  pointer-events: none;
}

.item-label {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.easing-item.selected .item-label {
  color: #18a058;
  font-weight: 500;
}

/* 右侧预览面板 */
.preview-panel {
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.curve-preview-large {
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.curve-preview-large svg {
  display: block;
}

.animation-preview {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

.animation-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.animation-track {
  height: 40px;
  background: #e0e0e0;
  border-radius: 4px;
  position: relative;
}

.animation-ball {
  position: absolute;
  bottom: 10px;
  width: 16px;
  height: 16px;
  background: #18a058;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
}
</style>
