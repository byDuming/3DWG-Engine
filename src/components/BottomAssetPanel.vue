<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useSceneStore } from '@/stores/modules/useScene.store'
  import { useUiEditorStore, type AssetCategory } from '@/stores/modules/uiEditor.store'
  import { assetApi } from '@/services/assetApi'
  import { useMessage, useDialog, type UploadFileInfo } from 'naive-ui'
  import {
    CloudUploadOutline,
    ChevronDownOutline,
    ChevronForwardOutline,
    ChevronUpOutline,
    CubeOutline,
    ImagesOutline,
    ColorPaletteOutline,
    SunnyOutline,
    PlayOutline,
    FolderOutline,
    FolderOpenOutline,
    RefreshOutline
  } from '@vicons/ionicons5'
  import { DeleteFilled, CloudCircleFilled } from '@vicons/material'
  import type { AssetRef } from '@/types/asset'
  // 时间轴组件
  import { Timeline } from '@/components/timeline'
  // 贴图压缩包解析
  import { parseTexturePack, getTextureSlotLabel, type TexturePackResult } from '@/utils/texturePackLoader'
  // UV2 处理
  import { ensureUV2ForModel } from '@/utils/threeObjectFactory'

  const sceneStore = useSceneStore()
  const uiEditorStore = useUiEditorStore()
  const message = useMessage()
  const dialog = useDialog()

  const uploading = ref(false)
  const modelUploadList = ref<UploadFileInfo[]>([])
  const loading = ref(false)
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragStartHeight = ref(0)
  const globalAssets = ref<AssetRef[]>([])  // 全局资产列表

  // ZIP 贴图包导入相关
  const showZipDialog = ref(false)
  const zipParseResult = ref<TexturePackResult | null>(null)
  const zipUploading = ref(false)
  const zipUploadProgress = ref(0)

  // 贴图模式：分类和搜索（仅贴图类别使用）
  const searchKeyword = ref('')
  const selectedTextureCategory = ref<string>('all')
  const collapsedFolders = ref<Set<string>>(new Set())

  // 贴图分类配置（与 TextureManager 对齐）
  const TEXTURE_CATEGORIES = [
    { key: 'all', label: '全部' },
    { key: 'diffuse', label: '漫反射', patterns: [/_diffuse\./i, /_diff\./i, /_color\./i, /_albedo\./i, /_basecolor\./i, /_base_color\./i, /_col\./i] },
    { key: 'normal', label: '法线', patterns: [/_normal\./i, /_nor\./i, /_nrm\./i, /_norm\./i, /_normalgl\./i, /_normaldx\./i] },
    { key: 'roughness', label: '粗糙度', patterns: [/_roughness\./i, /_rough\./i, /_rgh\./i] },
    { key: 'metalness', label: '金属度', patterns: [/_metalness\./i, /_metal\./i, /_metallic\./i, /_mtl\./i] },
    { key: 'ao', label: 'AO', patterns: [/_ao\./i, /_ambient\./i, /_ambientocclusion\./i, /_occlusion\./i, /_occ\./i] },
    { key: 'emissive', label: '自发光', patterns: [/_emissive\./i, /_emission\./i, /_emit\./i, /_glow\./i] },
    { key: 'displacement', label: '位移', patterns: [/_displacement\./i, /_disp\./i, /_height\./i] },
    { key: 'other', label: '其他' },
  ]

  function getTextureCategory(name: string): string {
    const lowerName = name.toLowerCase()
    for (const cat of TEXTURE_CATEGORIES) {
      if (cat.key === 'all' || cat.key === 'other') continue
      if (cat.patterns?.some(p => p.test(lowerName))) {
        return cat.key
      }
    }
    return 'other'
  }

  // 资产类别配置
  const categories: Array<{ key: AssetCategory; label: string; icon: any; accept: string; description: string }> = [
    { key: 'model', label: '模型', icon: CubeOutline, accept: '.glb,.gltf', description: '3D模型文件 (.glb, .gltf)' },
    { key: 'pointCloud', label: '点云', icon: CloudCircleFilled, accept: '.pcd', description: '点云文件 (.pcd)' },
    { key: 'texture', label: '贴图', icon: ImagesOutline, accept: '.png,.jpg,.jpeg,.webp', description: '图片贴图 (.png, .jpg, .webp)' },
    { key: 'material', label: '材质', icon: ColorPaletteOutline, accept: '.json', description: '材质预设 (.json)' },
    { key: 'hdri', label: 'HDRI', icon: SunnyOutline, accept: '.hdr,.exr', description: '环境贴图 (.hdr, .exr)' }
  ]

  // 当前类别配置
  const currentCategory = computed((): { key: AssetCategory; label: string; icon: any; accept: string; description: string } => {
    return categories.find(c => c.key === uiEditorStore.activeAssetCategory) ?? categories[0]!
  })

  // 加载全局资产列表
  async function loadGlobalAssets(type?: AssetRef['type']) {
    if (!assetApi.isStorageAvailable()) {
      return
    }
    loading.value = true
    try {
      globalAssets.value = await assetApi.getGlobalAssets(type)
    } catch (error) {
      console.error('加载资产列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 根据类别筛选资产（从全局资产列表筛选）
  const filteredAssets = computed(() => {
    const category = uiEditorStore.activeAssetCategory
    return globalAssets.value.filter(a => {
      if (category === 'model') return a.type === 'model' && (a.source === 'cloud' || (a as { source?: string }).source === 'remote')
      if (category === 'texture') return a.type === 'texture' && (a.source === 'cloud' || (a as { source?: string }).source === 'remote')
      if (category === 'material') return a.type === 'material'
      if (category === 'hdri') return a.type === 'hdri'
      if (category === 'pointCloud') return a.type === 'pointCloud' && (a.source === 'cloud' || (a as { source?: string }).source === 'remote')
      return false
    })
  })

  // 贴图模式：按 PBR 分类与搜索过滤
  const filteredTextureAssets = computed(() => {
    if (currentCategory.value.key !== 'texture') return []
    let result = filteredAssets.value
    if (selectedTextureCategory.value !== 'all') {
      result = result.filter(asset => getTextureCategory(asset.name) === selectedTextureCategory.value)
    }
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase().trim()
      result = result.filter(asset => asset.name.toLowerCase().includes(keyword))
    }
    return result
  })

  // 贴图模式：各 PBR 分类数量
  const categoryCounts = computed(() => {
    if (currentCategory.value.key !== 'texture') return { all: 0 } as Record<string, number>
    const counts: Record<string, number> = { all: filteredAssets.value.length }
    for (const asset of filteredAssets.value) {
      const cat = getTextureCategory(asset.name)
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  })

  // 贴图模式：按 meta.folder 分组
  const groupedByFolder = computed(() => {
    const map: Record<string, AssetRef[]> = {}
    for (const asset of filteredTextureAssets.value) {
      const key = asset.meta?.folder ?? ''
      if (!map[key]) map[key] = []
      map[key]!.push(asset)
    }
    return map
  })

  // 贴图模式：文件夹展示顺序（未分组优先，其余按名排序）
  const folderRowKeys = computed(() => {
    const keys = Object.keys(groupedByFolder.value)
    const rest = keys.filter(k => k !== '').sort()
    return (keys.includes('') ? ['', ...rest] : rest) as string[]
  })

  function getFolderDisplayName(key: string): string {
    return key === '' ? '未分组' : key
  }

  // 切换类别时重新加载对应类型的资产
  watch(() => uiEditorStore.activeAssetCategory, (newCategory) => {
    loadGlobalAssets(newCategory as AssetRef['type'])
  })

  onMounted(() => {
    loadGlobalAssets(uiEditorStore.activeAssetCategory as AssetRef['type'])
  })

  // 格式化文件大小
  function formatFileSize(bytes?: number): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // 上传资产到云端
  async function handleAssetUpload(fileList: UploadFileInfo[]) {
    modelUploadList.value = fileList
    const file = fileList[0]?.file
    if (!file) return

    if (!assetApi.isStorageAvailable()) {
      message.error('Supabase Storage 未配置，无法上传')
      modelUploadList.value = []
      return
    }

    uploading.value = true
    try {
      const result = await assetApi.uploadAsset({ file, type: uiEditorStore.activeAssetCategory as AssetRef['type'] })
      globalAssets.value.unshift(result.asset)  // 添加到全局列表前面
      sceneStore.registerRemoteAsset(result.asset)  // 同时注册到当前场景
      message.success(`"${file.name}" 上传成功`)
    } catch (error: any) {
      console.error('上传失败:', error)
      message.error(`上传失败: ${error.message || '未知错误'}`)
    } finally {
      uploading.value = false
      modelUploadList.value = []
    }
  }

  // 导入模型到场景
  async function handleImportModel(asset: AssetRef) {
    if (!sceneStore.threeScene) {
      message.warning('场景未初始化，请稍候再试')
      return
    }

    try {
      loading.value = true
      // 注册资产到当前场景（确保场景保存时包含引用）
      sceneStore.registerRemoteAsset(asset)
      
      const parentId = sceneStore.selectedObjectId ?? 'Scene'
      const created = sceneStore.addSceneObjectData({
        type: 'model',
        name: asset.name,
        parentId,
        assetId: asset.id
      })

      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(asset.uri)
      
      const target = sceneStore.objectsMap.get(created.id)
      if (target && gltf.scene) {
        // 确保模型的所有 Mesh 都有 uv2 属性（用于 aoMap 和 lightMap）
        ensureUV2ForModel(gltf.scene)
        target.children.slice().forEach((child: any) => target.remove(child))
        target.add(gltf.scene)
        sceneStore.selectedObjectId = created.id
        message.success(`模型 "${asset.name}" 已导入到场景`)
      }
    } catch (error: any) {
      console.error('导入模型失败:', error)
      message.error(`导入失败: ${error.message || '未知错误'}`)
    } finally {
      loading.value = false
    }
  }

  // 导入点云到场景
  async function handleImportPointCloud(asset: AssetRef) {
    if (!sceneStore.threeScene) {
      message.warning('场景未初始化，请稍候再试')
      return
    }
    try {
      loading.value = true
      sceneStore.registerRemoteAsset(asset)
      const parentId = sceneStore.selectedObjectId ?? 'Scene'
      const created = sceneStore.addSceneObjectData({
        type: 'pointCloud',
        name: asset.name,
        parentId,
        assetId: asset.id
      })
      sceneStore.selectedObjectId = created.id
      message.success(`点云 "${asset.name}" 已导入到场景`)
    } catch (error: any) {
      console.error('导入点云失败:', error)
      message.error(`导入失败: ${error.message || '未知错误'}`)
    } finally {
      loading.value = false
    }
  }

  // 导入资产（根据类型处理）
  async function handleImportAsset(asset: AssetRef) {
    if (asset.type === 'model') {
      await handleImportModel(asset)
    } else if (asset.type === 'pointCloud') {
      await handleImportPointCloud(asset)
    } else if (asset.type === 'texture') {
      // 将贴图 URL 复制到剪贴板，用户可在材质面板粘贴或通过资产选择器选择
      try {
        await navigator.clipboard.writeText(asset.uri)
        message.success(`贴图 "${asset.name}" URL 已复制，可在材质面板选择应用`)
      } catch {
        message.info(`贴图 URL: ${asset.uri}`)
      }
    } else if (asset.type === 'hdri') {
      // 应用HDRI到场景环境
      if (!sceneStore.threeScene) {
        message.warning('场景未初始化，请稍候再试')
        return
      }

      // 查找场景对象
      const sceneObject = sceneStore.objectDataList.find(obj => obj.type === 'scene')
      if (!sceneObject) {
        message.warning('请先选择场景对象')
        return
      }

      try {
        loading.value = true
        // 注册资产到当前场景
        sceneStore.registerRemoteAsset(asset)
        
        // 更新场景环境设置（.hdr 或 .exr 都使用 'hdr' 类型）
        // 同时设置环境贴图（用于光照）和背景（用于显示）
        const currentScene = sceneObject.scene ?? {}
        await sceneStore.updateSceneObjectData(sceneObject.id, {
          scene: {
            ...currentScene,
            environmentType: 'hdr',
            environmentMap: asset.uri,
            backgroundType: 'texture',
            backgroundTexture: asset.uri
          }
        } as any)
        
        message.success(`HDRI "${asset.name}" 已应用到场景环境`)
      } catch (error: any) {
        console.error('应用HDRI失败:', error)
        message.error(`应用失败: ${error.message || '未知错误'}`)
      } finally {
        loading.value = false
      }
    }
  }

  // 处理 ZIP 贴图包上传
  async function handleZipUpload(fileList: UploadFileInfo[]) {
    const file = fileList[0]?.file
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.zip')) {
      message.error('请上传 ZIP 压缩包')
      return
    }

    try {
      loading.value = true
      message.info('正在解析压缩包...')
      zipParseResult.value = await parseTexturePack(file)
      
      if (zipParseResult.value.textures.length === 0) {
        message.warning('未在压缩包中找到可识别的贴图文件')
        return
      }
      
      showZipDialog.value = true
    } catch (error: any) {
      console.error('解析压缩包失败:', error)
      message.error(`解析失败: ${error.message || '未知错误'}`)
    } finally {
      loading.value = false
    }
  }

  // 上传 ZIP 中的所有贴图
  async function uploadZipTextures() {
    if (!zipParseResult.value || !assetApi.isStorageAvailable()) return

    const textures = zipParseResult.value.textures
    const folderName = (zipParseResult.value.packName || '未命名').trim() || 'zip'
    zipUploading.value = true
    zipUploadProgress.value = 0

    const uploadedAssets: AssetRef[] = []
    const failed: string[] = []

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i]!
      try {
        const result = await assetApi.uploadAsset({
          file: texture.file,
          type: 'texture',
          folder: folderName,
        })
        uploadedAssets.push(result.asset)
        sceneStore.registerRemoteAsset(result.asset)
      } catch (error) {
        console.error(`上传 ${texture.fileName} 失败:`, error)
        failed.push(texture.fileName)
      }
      zipUploadProgress.value = Math.round(((i + 1) / textures.length) * 100)
    }

    // 更新本地列表
    globalAssets.value = [...uploadedAssets, ...globalAssets.value]

    zipUploading.value = false
    showZipDialog.value = false
    zipParseResult.value = null

    if (failed.length > 0) {
      message.warning(`${uploadedAssets.length} 个贴图上传成功，${failed.length} 个失败`)
    } else {
      message.success(`${uploadedAssets.length} 个贴图全部上传成功`)
    }
  }

  function toggleFolder(key: string) {
    const next = new Set(collapsedFolders.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsedFolders.value = next
  }

  // 删除文件夹（删除该文件夹下全部贴图）
  async function handleDeleteFolder(folderKey: string) {
    const assets = globalAssets.value.filter((a) => (a.meta?.folder ?? '') === folderKey)
    const n = assets.length
    const label = getFolderDisplayName(folderKey)
    dialog.warning({
      title: '确认删除',
      content: `确定要删除「${label}」及其下 ${n} 个贴图吗？此操作不可恢复。`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        let ok = 0
        let fail = 0
        for (const asset of assets) {
          try {
            const success = await assetApi.deleteAsset(asset)
            if (success) {
              const idx = globalAssets.value.findIndex((a) => a.id === asset.id)
              if (idx > -1) globalAssets.value.splice(idx, 1)
              ok++
            } else {
              fail++
            }
          } catch {
            fail++
          }
        }
        if (fail > 0) {
          message.warning(`已删除 ${ok} 个，${fail} 个删除失败`)
        } else {
          message.success(`已删除 ${ok} 个贴图`)
        }
      },
    })
  }

  // 删除资产
  async function handleDeleteAsset(asset: AssetRef) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除 "${asset.name}" 吗？此操作不可恢复。`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const success = await assetApi.deleteAsset(asset)
          if (success) {
            // 从全局资产列表中移除
            const index = globalAssets.value.findIndex(a => a.id === asset.id)
            if (index > -1) {
              globalAssets.value.splice(index, 1)
            }
            message.success('删除成功')
          } else {
            message.error('删除失败')
          }
        } catch (error: any) {
          console.error('删除失败:', error)
          message.error(`删除失败: ${error.message || '未知错误'}`)
        }
      }
    })
  }

  // 拖拽调整高度
  function startDrag(e: MouseEvent) {
    isDragging.value = true
    dragStartY.value = e.clientY
    dragStartHeight.value = uiEditorStore.assetPanelHeight
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  function onDrag(e: MouseEvent) {
    if (!isDragging.value) return
    const deltaY = dragStartY.value - e.clientY
    uiEditorStore.setAssetPanelHeight(dragStartHeight.value + deltaY)
  }

  function stopDrag() {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }
</script>

<template>
  <div class="bottom-asset-panel" :style="{ height: uiEditorStore.isAssetPanelOpen ? `${uiEditorStore.assetPanelHeight}px` : '40px' }">
    <!-- 拖拽调整手柄 -->
    <div
      v-if="uiEditorStore.isAssetPanelOpen"
      class="resize-handle"
      @mousedown="startDrag"
    />
    
    <!-- 标题栏 -->
    <div class="panel-header" @click="uiEditorStore.toggleAssetPanel">
      <div class="header-left">
        <!-- 模式切换标签 -->
        <div class="mode-tabs" @click.stop>
          <div 
            class="mode-tab" 
            :class="{ active: uiEditorStore.bottomPanelMode === 'assets' }"
            @click="uiEditorStore.setBottomPanelMode('assets')"
          >
            <n-icon size="16"><FolderOutline /></n-icon>
            <span>资产管理</span>
            <n-tag v-if="filteredAssets.length > 0 && uiEditorStore.bottomPanelMode === 'assets'" size="small" :bordered="false">
              {{ filteredAssets.length }}
            </n-tag>
          </div>
          <div 
            class="mode-tab" 
            :class="{ active: uiEditorStore.bottomPanelMode === 'timeline' }"
            @click="uiEditorStore.setBottomPanelMode('timeline')"
          >
            <n-icon size="16"><PlayOutline /></n-icon>
            <span>时间轴</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <n-icon size="18">
          <ChevronUpOutline v-if="uiEditorStore.isAssetPanelOpen" />
          <ChevronDownOutline v-else />
        </n-icon>
      </div>
    </div>

    <!-- 面板内容 -->
    <div v-show="uiEditorStore.isAssetPanelOpen" class="panel-content">
      <!-- 时间轴模式 -->
      <Timeline v-if="uiEditorStore.bottomPanelMode === 'timeline'" class="timeline-wrapper" />
      
      <!-- 资产管理模式 -->
      <div v-else class="assets-mode">
        <!-- 左侧类别导航 -->
        <div class="category-nav">
          <n-tooltip
            v-for="cat in categories"
            :key="cat.key"
            trigger="hover"
            placement="right"
          >
            <template #trigger>
              <div
                class="category-item"
                :class="{ active: uiEditorStore.activeAssetCategory === cat.key }"
                @click="uiEditorStore.setAssetCategory(cat.key)"
              >
                <n-icon size="20">
                  <component :is="cat.icon" />
                </n-icon>
              </div>
            </template>
            {{ cat.label }}
          </n-tooltip>
        </div>

        <!-- 右侧内容区 -->
        <div class="asset-content">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <span class="category-label">{{ currentCategory.label }}</span>
            </div>
            <div class="toolbar-right">
              <!-- 刷新按钮 -->
              <n-button size="small" quaternary @click="loadGlobalAssets(currentCategory.key as AssetRef['type'])" :loading="loading">
                <template #icon>
                  <n-icon><RefreshOutline /></n-icon>
                </template>
              </n-button>
              <!-- ZIP 导入（仅贴图） -->
              <n-upload
                v-if="currentCategory.key === 'texture'"
                :default-upload="false"
                :show-file-list="false"
                accept=".zip"
                @update:file-list="handleZipUpload"
                :disabled="loading"
              >
                <n-button size="small" quaternary>
                  <template #icon>
                    <n-icon><FolderOpenOutline /></n-icon>
                  </template>
                  导入压缩包
                </n-button>
              </n-upload>
              <!-- 云端上传 -->
              <n-upload
                :default-upload="false"
                :show-file-list="false"
                :accept="currentCategory.accept"
                :file-list="modelUploadList"
                @update:file-list="handleAssetUpload"
                :disabled="uploading || !assetApi.isStorageAvailable()"
              >
                <n-button size="small" type="primary" :loading="uploading">
                  <template #icon>
                    <n-icon><CloudUploadOutline /></n-icon>
                  </template>
                  上传
                </n-button>
              </n-upload>
            </div>
          </div>

          <!-- 搜索和分类栏（仅贴图） -->
          <div v-if="currentCategory.key === 'texture'" class="filter-bar">
            <n-input
              v-model:value="searchKeyword"
              placeholder="搜索贴图..."
              size="small"
              clearable
              class="search-input"
            >
              <template #prefix>
                <n-icon size="16" color="#999">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 2a8 8 0 105.293 14.707l5 5a1 1 0 001.414-1.414l-5-5A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/>
                  </svg>
                </n-icon>
              </template>
            </n-input>
            <div class="category-tabs">
              <button
                v-for="cat in TEXTURE_CATEGORIES"
                :key="cat.key"
                class="category-tab"
                :class="{ active: selectedTextureCategory === cat.key }"
                @click="selectedTextureCategory = cat.key"
              >
                {{ cat.label }}
                <span v-if="categoryCounts[cat.key]" class="category-count">{{ categoryCounts[cat.key] }}</span>
              </button>
            </div>
          </div>

          <!-- 资产列表 -->
          <div class="asset-list">
            <n-spin :show="loading">
              <!-- 贴图模式：文件夹分组 -->
              <template v-if="currentCategory.key === 'texture'">
                <n-scrollbar v-if="folderRowKeys.length > 0" style="max-height: calc(100% - 8px);">
                  <div class="folder-list">
                    <div
                      v-for="key in folderRowKeys"
                      :key="key || '__root__'"
                      class="folder-block"
                    >
                      <div class="folder-header" @click="toggleFolder(key)">
                        <n-icon class="folder-chevron" :size="16">
                          <ChevronDownOutline v-if="!collapsedFolders.has(key)" />
                          <ChevronForwardOutline v-else />
                        </n-icon>
                        <n-icon :size="18"><FolderOpenOutline /></n-icon>
                        <span class="folder-name">{{ getFolderDisplayName(key) }}</span>
                        <span class="folder-count">{{ (groupedByFolder[key] ?? []).length }}</span>
                        <n-button
                          size="tiny"
                          type="error"
                          quaternary
                          class="folder-delete"
                          @click.stop="handleDeleteFolder(key)"
                        >
                          <template #icon>
                            <n-icon><DeleteFilled /></n-icon>
                          </template>
                        </n-button>
                      </div>
                      <div v-show="!collapsedFolders.has(key)" class="folder-content">
                        <div class="asset-grid">
                          <div
                            v-for="asset in (groupedByFolder[key] ?? [])"
                            :key="asset.id"
                            class="asset-item"
                            @click="handleImportAsset(asset)"
                          >
                            <div class="asset-preview" :class="{ 'texture-preview': asset.type === 'texture' }">
                              <img
                                v-if="asset.thumbnail || asset.type === 'texture'"
                                :src="asset.thumbnail || asset.uri"
                                :alt="asset.name"
                                loading="lazy"
                              />
                              <n-icon v-else size="32" color="#1d1d1d">
                                <component :is="currentCategory.icon" />
                              </n-icon>
                              <div class="asset-overlay">
                                <n-button size="tiny" type="primary" @click.stop="handleImportAsset(asset)">
                                  导入
                                </n-button>
                                <n-button size="tiny" type="error" @click.stop="handleDeleteAsset(asset)">
                                  <template #icon>
                                    <n-icon><DeleteFilled /></n-icon>
                                  </template>
                                </n-button>
                              </div>
                            </div>
                            <div class="asset-name">
                              <n-ellipsis :line-clamp="1" :tooltip="{ placement: 'top' }">
                                {{ asset.name }}
                              </n-ellipsis>
                            </div>
                            <div class="asset-size">{{ formatFileSize(asset.meta?.size) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </n-scrollbar>
                <div v-else class="empty-state">
                  <n-icon size="40" color="#666">
                    <FolderOpenOutline />
                  </n-icon>
                  <template v-if="filteredAssets.length === 0">
                    <div class="empty-text">暂无贴图</div>
                    <div class="empty-hint">上传贴图或导入 PBR 贴图压缩包</div>
                  </template>
                  <template v-else>
                    <div class="empty-text">无匹配结果</div>
                    <div class="empty-hint">
                      {{ searchKeyword ? `未找到包含"${searchKeyword}"的贴图` : '该分类下暂无贴图' }}
                    </div>
                    <n-button size="small" @click="searchKeyword = ''; selectedTextureCategory = 'all'">
                      重置筛选
                    </n-button>
                  </template>
                </div>
              </template>

              <!-- 非贴图模式：扁平列表 -->
              <template v-else>
                <n-scrollbar v-if="filteredAssets.length > 0" style="max-height: calc(100% - 8px);">
                  <div class="asset-grid">
                    <div
                      v-for="asset in filteredAssets"
                      :key="asset.id"
                      class="asset-item"
                      @click="handleImportAsset(asset)"
                    >
                      <div class="asset-preview" :class="{ 'texture-preview': asset.type === 'texture' }">
                        <img
                          v-if="asset.thumbnail || (asset.type === 'texture')"
                          :src="asset.thumbnail || asset.uri"
                          :alt="asset.name"
                          loading="lazy"
                        />
                        <div v-else-if="asset.type === 'hdri'" class="hdri-placeholder">
                          <n-icon size="32" color="#1d1d1d">
                            <component :is="currentCategory.icon" />
                          </n-icon>
                          <span class="hdri-label">HDRI环境贴图</span>
                        </div>
                        <n-icon v-else size="32" color="#1d1d1d">
                          <component :is="currentCategory.icon" />
                        </n-icon>
                        <div class="asset-overlay">
                          <n-button size="tiny" type="primary" @click.stop="handleImportAsset(asset)">
                            导入
                          </n-button>
                          <n-button size="tiny" type="error" @click.stop="handleDeleteAsset(asset)">
                            <template #icon>
                              <n-icon><DeleteFilled /></n-icon>
                            </template>
                          </n-button>
                        </div>
                      </div>
                      <div class="asset-name">
                        <n-ellipsis :line-clamp="1" :tooltip="{ placement: 'top' }">
                          {{ asset.name }}
                        </n-ellipsis>
                      </div>
                      <div class="asset-size">{{ formatFileSize(asset.meta?.size) }}</div>
                    </div>
                  </div>
                </n-scrollbar>
                <div v-else class="empty-state">
                  <n-icon size="40" color="#666">
                    <component :is="currentCategory.icon" />
                  </n-icon>
                  <div class="empty-text">暂无{{ currentCategory.label }}</div>
                  <div class="empty-hint">{{ currentCategory.description }}</div>
                </div>
              </template>
            </n-spin>
          </div>
        </div>
      </div>
    </div>

    <!-- ZIP 解析结果弹窗 -->
    <n-modal
      v-model:show="showZipDialog"
      preset="card"
      title="导入 PBR 贴图包"
      :style="{ width: '500px' }"
      :mask-closable="!zipUploading"
      :closable="!zipUploading"
    >
      <div v-if="zipParseResult" class="zip-result">
        <div class="zip-info">
          <span>已识别 {{ zipParseResult.textures.length }} 张贴图</span>
        </div>

        <!-- 识别的贴图列表 -->
        <n-scrollbar style="max-height: 300px;">
          <div class="texture-list">
            <div
              v-for="texture in zipParseResult.textures"
              :key="texture.fileName"
              class="texture-list-item"
            >
              <div class="texture-slot-badge">
                {{ getTextureSlotLabel(texture.slot) }}
              </div>
              <span class="texture-file-name">{{ texture.fileName }}</span>
            </div>
          </div>
        </n-scrollbar>

        <!-- 未识别的文件 -->
        <div v-if="zipParseResult.unmatched.length > 0" class="unmatched-section">
          <div class="unmatched-header">
            <span>{{ zipParseResult.unmatched.length }} 个文件未识别（将跳过）</span>
          </div>
          <n-collapse>
            <n-collapse-item title="查看未识别文件">
              <div class="unmatched-list">
                <span v-for="name in zipParseResult.unmatched" :key="name" class="unmatched-item">
                  {{ name }}
                </span>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>

        <!-- 上传进度 -->
        <n-progress
          v-if="zipUploading"
          type="line"
          :percentage="zipUploadProgress"
          :indicator-placement="'inside'"
          processing
        />
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showZipDialog = false" :disabled="zipUploading">
            取消
          </n-button>
          <n-button
            type="primary"
            @click="uploadZipTextures"
            :loading="zipUploading"
            :disabled="!zipParseResult?.textures.length"
          >
            上传全部
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.bottom-asset-panel {
  /* background: #1e1e1e; */
  /* border-top: 1px solid #333; */
  display: flex;
  flex-direction: column;
  transition: height 0.2s ease;
  position: relative;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
  z-index: 10;
}

.resize-handle:hover {
  background: var(--n-primary-color, rgba(24, 160, 88, 0.5));
}

.panel-header {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.panel-header:hover {
  background: rgba(0, 0, 0, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.mode-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.15s;
}

.mode-tab:hover {
  color: #1d1d1d;
  background: rgba(0, 0, 0, 0.05);
}

.mode-tab.active {
  color: var(--n-primary-color, #18a058);
  background: var(--n-primary-color-pressed, rgba(24, 160, 88, 0.1));
}

.header-right {
  color: #888;
}

.panel-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.timeline-wrapper {
  flex: 1;
  overflow: hidden;
}

.assets-mode {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-nav {
  width: 48px;
  /* background: #1a1a1a; */
  /* border-right: 1px solid #333; */
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 4px;
}

.category-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #888;
  transition: all 0.15s;
}

.category-item:hover {
  color: #1d1d1d;
  /* background: rgba(255, 255, 255, 0.05); */
}

.category-item.active {
  color: var(--n-primary-color, #18a058);
  /* background: rgba(64, 158, 255, 0.1); */
  border-left: 2px solid var(--n-primary-color, #18a058);
}

.asset-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* border-bottom: 1px solid #333; */
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-label {
  font-size: 12px;
  color: #aaa;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 搜索和分类栏（贴图模式） */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color, #e0e0e0);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
}

.category-tabs {
  display: flex;
  gap: 4px;
  padding: 2px 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.category-tabs::-webkit-scrollbar {
  height: 4px;
}

.category-tabs::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  background: var(--n-color-embedded, #f5f5f5);
  color: var(--n-text-color-2, #666);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.category-tab:hover {
  background: var(--n-color-hover, #e8e8e8);
}

.category-tab.active {
  background: var(--n-primary-color, #18a058);
  color: white;
}

.category-count {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.1);
}

.category-tab.active .category-count {
  background: rgba(255, 255, 255, 0.3);
}

/* 贴图模式：文件夹分组 */
.folder-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.folder-block {
  border-radius: 8px;
  background: var(--n-color-embedded, #f5f5f5);
  overflow: hidden;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.folder-header:hover {
  background: var(--n-color-hover, #e8e8e8);
}

.folder-chevron {
  flex-shrink: 0;
  color: var(--n-text-color-2, #666);
}

.folder-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-1, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 11px;
  color: var(--n-text-color-3, #999);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}

.folder-delete {
  flex-shrink: 0;
}

.folder-content {
  padding: 0 12px 12px;
}

.folder-content .asset-grid {
  margin: 0;
}

.asset-list {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: auto;
}

.asset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px;
}

.asset-item {
  width: 100px;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  background: #eee;
  transition: all 0.15s;
}

.asset-item:hover {
  background: #303030;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.asset-preview {
  width: 100px;
  height: 80px;
  /* background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%); */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.asset-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-preview.texture-preview {
  background: linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

.hdri-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.hdri-label {
  font-size: 10px;
  color: #666;
  text-align: center;
  padding: 0 4px;
  line-height: 1.2;
}

.asset-overlay {
  position: absolute;
  inset: 0;
  /* background: rgba(0, 0, 0, 0.7); */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.asset-item:hover .asset-overlay {
  opacity: 1;
}

.asset-name {
  padding: 6px 8px 2px;
  font-size: 11px;
  color: #1d1d1d;
}

.asset-size {
  padding: 0 8px 6px;
  font-size: 10px;
  color: #888;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-text {
  font-size: 13px;
  color: #888;
}

.empty-hint {
  font-size: 11px;
  color: #666;
}

/* ZIP 导入弹窗样式 */
.zip-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.zip-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.texture-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.texture-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.texture-slot-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: #18a058;
  color: white;
  border-radius: 4px;
  white-space: nowrap;
}

.texture-file-name {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unmatched-section {
  margin-top: 8px;
}

.unmatched-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #f0a020;
  margin-bottom: 8px;
}

.unmatched-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.unmatched-item {
  font-size: 12px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  color: #999;
}
</style>
