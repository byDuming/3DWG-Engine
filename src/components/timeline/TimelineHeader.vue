<script setup lang="ts">
/**
 * 时间轴刻度组件
 */

import { computed } from 'vue'

const props = defineProps<{
  duration: number
  pixelsPerSecond: number
  scrollX: number
  formatTime: (seconds: number) => string
}>()

// 计算刻度间隔（自适应缩放）
const tickInterval = computed(() => {
  const pps = props.pixelsPerSecond
  if (pps >= 200) return 0.5  // 每0.5秒一个刻度
  if (pps >= 100) return 1    // 每1秒
  if (pps >= 50) return 2     // 每2秒
  if (pps >= 25) return 5     // 每5秒
  return 10                    // 每10秒
})

// 生成刻度列表
const ticks = computed(() => {
  const result: Array<{ time: number; x: number; major: boolean }> = []
  const interval = tickInterval.value
  const majorInterval = interval * 5 // 每5个小刻度一个大刻度
  
  for (let time = 0; time <= props.duration + interval; time += interval) {
    result.push({
      time,
      x: time * props.pixelsPerSecond,
      major: time % majorInterval < 0.001 || Math.abs(time % majorInterval - majorInterval) < 0.001
    })
  }
  
  return result
})
</script>

<template>
  <div class="timeline-header">
    <svg class="tick-marks" :width="duration * pixelsPerSecond + 200" height="30">
      <g v-for="tick in ticks" :key="tick.time">
        <!-- 刻度线 -->
        <line
          :x1="tick.x"
          :y1="tick.major ? 10 : 18"
          :x2="tick.x"
          :y2="30"
          :stroke="tick.major ? '#999' : '#ccc'"
          stroke-width="1"
        />
        <!-- 时间标签（仅大刻度） -->
        <text
          v-if="tick.major"
          :x="tick.x + 4"
          y="20"
          fill="#666"
          font-size="10"
        >
          {{ formatTime(tick.time) }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.timeline-header {
  height: 30px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  overflow: hidden;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tick-marks {
  display: block;
}
</style>
