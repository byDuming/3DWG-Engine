<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  // 场景视图
  import Scene from '@/components/Scene.vue'
  // 左侧编辑面板
  import LeftEditPanel from '@/components/LeftEditPanel.vue'
  // 底部资产面板
  import BottomAssetPanel from '@/components/BottomAssetPanel.vue'

  const route = useRoute()
  const router = useRouter()

  // 从 URL 获取场景ID，传递给 Scene 组件
  const sceneId = computed(() => {
    const id = route.query.sceneId
    return id ? Number(id) : null
  })

  // 从 URL 获取模式：preview（预览）或 edit（编辑），默认为编辑模式
  const isEditMode = computed(() => {
    return route.query.mode !== 'preview'
  })

  // 当前模式字符串，传递给 Scene 组件
  const currentMode = computed<'preview' | 'edit'>(() => {
    return route.query.mode === 'preview' ? 'preview' : 'edit'
  })

  // 从预览模式切换到编辑模式
  function enterEditMode() {
    router.replace({
      path: '/engine',
      query: {
        sceneId: sceneId.value,
        mode: 'edit'
      }
    })
  }

  // 从编辑模式切换到预览模式
  function enterPreviewMode() {
    router.replace({
      path: '/engine',
      query: {
        sceneId: sceneId.value,
        mode: 'preview'
      }
    })
  }

  // 返回场景列表
  function goBack() {
    router.push('/')
  }
</script>

<template>
  <div class="engine-container" :class="{ 'edit-mode': isEditMode }">
    <!-- 主内容区：场景 + 底部资产面板 -->
    <div class="main-area">
      <div class="scene-area">
        <Scene :scene-id="sceneId" :mode="currentMode" />
      </div>
      <!-- 底部资产面板 - 仅编辑模式显示 -->
      <BottomAssetPanel v-show="isEditMode" />
    </div>

    <!-- 右侧编辑面板 - 仅编辑模式显示 -->
    <div v-show="isEditMode" class="edit-panel-area">
      <LeftEditPanel />
    </div>

    <!-- 悬浮工具栏 - 始终显示 -->
    <div class="floating-toolbar">
      <n-space>
        <n-button @click="goBack">
          <template #icon>
            <n-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></n-icon>
          </template>
          返回列表
        </n-button>
        <!-- 预览模式：显示进入编辑按钮 -->
        <n-button v-if="!isEditMode" type="primary" @click="enterEditMode">
          <template #icon>
            <n-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></n-icon>
          </template>
          进入编辑
        </n-button>
        <!-- 编辑模式：显示预览按钮 -->
        <n-button v-else @click="enterPreviewMode">
          <template #icon>
            <n-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></n-icon>
          </template>
          预览
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.engine-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  position: relative;
}

/* 主内容区（场景 + 资产面板） */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.scene-area {
  flex: 1;
  overflow: hidden;
}

/* 右侧编辑面板区域 */
.edit-panel-area {
  width: 14%;
  min-width: 280px;
  max-width: 400px;
  height: 100%;
  overflow: hidden;
  border-left: 1px solid var(--n-border-color, #e0e0e0);
}

/* 悬浮工具栏 */
.floating-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(8px);
}
</style>
