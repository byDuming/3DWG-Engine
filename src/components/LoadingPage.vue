<script setup lang="ts">
/**
 * 场景加载页面组件
 * 
 * 功能：
 * - 显示场景加载总体进度
 * - 列出每个资源的加载状态
 * - 优雅的动画效果
 */

import { computed } from 'vue'
import { NProgress, NIcon, NScrollbar } from 'naive-ui'
import { 
  CheckmarkCircle as CheckIcon,
  CloseCircle as ErrorIcon,
  Ellipse as PendingIcon,
  Sync as LoadingIcon
} from '@vicons/ionicons5'
import { useLoadingStore, type LoadingStatus, type ResourceType } from '@/stores/modules/useLoading.store'

const loadingStore = useLoadingStore()

/** 状态图标映射 */
const statusIcons: Record<LoadingStatus, any> = {
  pending: PendingIcon,
  loading: LoadingIcon,
  loaded: CheckIcon,
  error: ErrorIcon
}

/** 状态颜色映射 */
const statusColors: Record<LoadingStatus, string> = {
  pending: '#909399',
  loading: '#18a058',
  loaded: '#18a058',
  error: '#f56c6c'
}

/** 资源类型颜色 */
const typeColors: Record<ResourceType, string> = {
  model: '#18a058',
  texture: '#2080f0',
  hdr: '#f0a020',
  cubemap: '#a855f7',
  pointcloud: '#06b6d4'
}

/** 资源类型标签 */
const typeLabels: Record<ResourceType, string> = {
  model: '模型',
  texture: '贴图',
  hdr: 'HDR',
  cubemap: '立方体',
  pointcloud: '点云'
}

/** 格式化进度文本 */
function formatProgress(resource: any): string {
  if (resource.status === 'loaded') return '完成'
  if (resource.status === 'error') return '失败'
  if (resource.status === 'pending') return '等待中'
  if (resource.progress > 0) return `${Math.round(resource.progress)}%`
  return '加载中'
}

/** 显示的资源列表（最多显示10个，优先显示正在加载和等待的） */
const displayResources = computed(() => {
  return loadingStore.resourceList.slice(0, 15)
})

/** 是否有更多资源 */
const hasMoreResources = computed(() => {
  return loadingStore.totalCount > 15
})
</script>

<template>
  <Transition name="fade">
    <div v-if="loadingStore.isLoading" class="loading-page">
      <!-- 背景遮罩 -->
      <div class="loading-backdrop"></div>
      
      <!-- 加载面板 -->
      <div class="loading-panel">
        <!-- Logo 区域 -->
        <div class="loading-header">
          <div class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="logo-text">3DWG Engine</span>
          </div>
          <p class="loading-phase">{{ loadingStore.loadingPhase }}</p>
        </div>
        
        <!-- 主进度区域 -->
        <div class="progress-section">
          <!-- 圆形进度指示器 -->
          <div class="circular-progress">
            <svg class="progress-ring" viewBox="0 0 120 120">
              <!-- 背景圆环 -->
              <circle
                class="progress-ring-bg"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke-width="8"
              />
              <!-- 进度圆环 -->
              <circle
                class="progress-ring-fill"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke-width="8"
                :stroke-dasharray="326.73"
                :stroke-dashoffset="326.73 * (1 - loadingStore.totalProgress / 100)"
              />
            </svg>
            <div class="progress-text">
              <span class="progress-value">{{ loadingStore.totalProgress }}</span>
              <span class="progress-unit">%</span>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-value">{{ loadingStore.loadedCount }}</span>
              <span class="stat-label">已加载</span>
            </div>
            <div class="stat-divider">/</div>
            <div class="stat-item">
              <span class="stat-value">{{ loadingStore.totalCount }}</span>
              <span class="stat-label">总计</span>
            </div>
            <template v-if="loadingStore.errorCount > 0">
              <div class="stat-divider">·</div>
              <div class="stat-item stat-error">
                <span class="stat-value">{{ loadingStore.errorCount }}</span>
                <span class="stat-label">失败</span>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 加载详情 -->
        <div class="resource-section">
          <div class="resource-header">
            <span>加载详情</span>
            <span v-if="loadingStore.totalSizeBytes > 0" class="size-info">
              {{ loadingStore.formatSize(loadingStore.totalLoadedBytes) }} / {{ loadingStore.formatSize(loadingStore.totalSizeBytes) }}
            </span>
          </div>
          
          <n-scrollbar style="max-height: 220px">
            <div class="resource-list">
              <!-- 场景数据获取状态 -->
              <div 
                class="resource-item"
                :class="[`status-${loadingStore.sceneDataStatus}`]"
              >
                <div class="resource-icon" :style="{ color: statusColors[loadingStore.sceneDataStatus] }">
                  <n-icon :component="statusIcons[loadingStore.sceneDataStatus]" :class="{ spinning: loadingStore.sceneDataStatus === 'loading' }" />
                </div>
                <div class="resource-name">场景数据</div>
                <div class="resource-type" style="background-color: rgba(139, 92, 246, 0.2); color: #8b5cf6;">
                  数据
                </div>
                <div class="resource-progress" :style="{ color: statusColors[loadingStore.sceneDataStatus] }">
                  {{ loadingStore.sceneDataStatus === 'loaded' ? '完成' : loadingStore.sceneDataStatus === 'loading' ? '获取中' : loadingStore.sceneDataStatus === 'error' ? '失败' : '等待中' }}
                </div>
              </div>
              
              <!-- 资源列表 -->
              <TransitionGroup name="list">
                <div 
                  v-for="resource in displayResources" 
                  :key="resource.id"
                  class="resource-item"
                  :class="[`status-${resource.status}`]"
                >
                  <!-- 状态图标 -->
                  <div class="resource-icon" :style="{ color: statusColors[resource.status] }">
                    <n-icon :component="statusIcons[resource.status]" :class="{ spinning: resource.status === 'loading' }" />
                  </div>
                  
                  <!-- 资源名称 -->
                  <div class="resource-name" :title="resource.name">
                    {{ resource.name }}
                  </div>
                  
                  <!-- 资源类型标签 -->
                  <div class="resource-type" :style="{ backgroundColor: typeColors[resource.type] + '20', color: typeColors[resource.type] }">
                    {{ typeLabels[resource.type] }}
                  </div>
                  
                  <!-- 进度/状态 -->
                  <div class="resource-progress" :style="{ color: statusColors[resource.status] }">
                    {{ formatProgress(resource) }}
                  </div>
                </div>
              </TransitionGroup>
              
              <!-- 更多资源提示 -->
              <div v-if="hasMoreResources" class="more-resources">
                还有 {{ loadingStore.totalCount - 15 }} 个资源...
              </div>
            </div>
          </n-scrollbar>
        </div>
        
        <!-- 底部提示 -->
        <div class="loading-footer">
          <span v-if="loadingStore.elapsedTime > 0" class="elapsed-time">
            已用时 {{ loadingStore.elapsedTime }}s
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 加载页面容器 */
.loading-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 背景遮罩 - 高斯模糊 */
.loading-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* 加载面板 */
.loading-panel {
  position: relative;
  width: 400px;
  max-width: 90vw;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* 头部区域 */
.loading-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: #18a058;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.5px;
}

.loading-phase {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0;
}

/* 进度区域 */
.progress-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

/* 圆形进度指示器 */
.circular-progress {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.progress-ring-fill {
  stroke: #18a058;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-value {
  font-size: 32px;
  font-weight: 600;
  color: #fff;
}

.progress-unit {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 2px;
}

/* 统计行 */
.stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 18px;
}

.stat-error .stat-value {
  color: #f56c6c;
}

/* 资源列表区域 */
.resource-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.size-info {
  font-family: 'SF Mono', 'Monaco', monospace;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 资源项 */
.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s ease;
}

.resource-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.resource-item.status-loading {
  background: rgba(24, 160, 88, 0.1);
}

.resource-item.status-error {
  background: rgba(245, 108, 108, 0.1);
}

.resource-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-icon .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.resource-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-type {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.resource-progress {
  flex-shrink: 0;
  width: 50px;
  text-align: right;
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', monospace;
}

.more-resources {
  text-align: center;
  padding: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

/* 底部区域 */
.loading-footer {
  text-align: center;
  min-height: 20px;
}

.elapsed-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 深色滚动条样式 */
:deep(.n-scrollbar-rail) {
  background: transparent !important;
}

:deep(.n-scrollbar-rail__scrollbar) {
  background: rgba(255, 255, 255, 0.2) !important;
}
</style>
