# Supabase 集成设置指南

## 第一步：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册/登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Name**: 3DWG-Engine（或你喜欢的名称）
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择离你最近的区域（建议选择亚洲区域）
4. 等待项目创建完成（约 2 分钟）

## 第二步：获取 API 密钥

1. 在项目 Dashboard 中，点击左侧菜单的 **Settings** → **API**
2. 找到以下信息：
   - **Project URL**: 复制这个 URL
   - **anon/public key**: 复制这个密钥

## 第三步：配置环境变量

### 本地开发环境

1. 在项目根目录复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env` 文件，填入你的 Supabase 配置：
   ```env
   VITE_SUPABASE_URL=你的_Project_URL
   VITE_SUPABASE_ANON_KEY=你的_anon_key
   ```

**示例：**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### GitHub Pages 部署环境

**重要**：`.env` 文件不会被提交到 Git（已在 `.gitignore` 中），所以部署时需要配置 GitHub Secrets：

1. 进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **"New repository secret"** 按钮
3. 添加以下两个 Secrets（名称必须完全一致）：
   - **Name**: `VITE_SUPABASE_URL`
     **Value**: 你的 Supabase 项目 URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     **Value**: 你的 Supabase anon key
4. 保存后，GitHub Actions 构建时会自动使用这些环境变量

**注意**：如果不配置 GitHub Secrets，应用仍可运行，但会回退到本地存储模式（不会显示警告，因为已在生产环境静默处理）

## 第四步：创建数据库表

1. 在 Supabase Dashboard 中，点击左侧菜单的 **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase-schema.sql` 文件中的内容
4. 粘贴到 SQL Editor 中
5. 点击 **Run** 执行脚本

## 第五步：配置 Storage（资产存储）

为了支持模型和贴图纹理资产的上传，需要创建 Storage 存储桶并配置策略：

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Storage**
2. 点击 **New bucket** 创建新存储桶
3. 填写存储桶信息：
   - **Name**: `assets`（必须使用这个名称，代码中已硬编码）
   - **Public bucket**: 勾选 ✅（允许公开访问资产文件）
   - **File size limit**: 根据需要设置（默认 50MB，对于 3D 模型和贴图已足够）
   - **Allowed MIME types**: 留空（允许所有类型）或根据需要限制
4. 点击 **Create bucket** 创建

### 配置 Storage 策略

创建存储桶后，需要配置策略以允许文件上传和访问。**请在 SQL Editor 中执行以下 SQL 脚本**：

1. 在 Supabase Dashboard 中，点击左侧菜单的 **SQL Editor**
2. 点击 **New Query** 创建新查询
3. 复制并粘贴以下 SQL 代码：

```sql
-- 允许匿名用户上传文件到 assets 存储桶
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'assets');

-- 允许匿名用户读取 assets 存储桶中的文件
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assets');

-- 允许匿名用户删除 assets 存储桶中的文件（可选，如果需要删除功能）
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'assets');
```

4. 点击 **Run** 执行脚本
5. 执行成功后，可以在 Storage → `assets` → Policies 中看到创建的策略

**注意**：
- 如果执行时提示策略已存在，可以先删除旧策略或使用 `CREATE POLICY IF NOT EXISTS`（如果支持）
- 如果你的项目需要用户认证，可以将 `TO public` 改为 `TO authenticated` 来限制只有登录用户才能上传

### Storage 免费额度

Supabase 免费层提供：
- **1GB** 存储空间
- **2GB** 带宽/月

对于几 MB 到几十 MB 的资产文件，免费额度已足够使用。

## 第六步：启用认证（可选但推荐）

如果需要用户登录功能：

1. 在 Supabase Dashboard 中，点击 **Authentication** → **Providers**
2. 启用你需要的认证方式（如 Email、Google、GitHub 等）
3. 配置相应的设置

## 第七步：测试连接

1. 重启开发服务器：
   ```bash
   pnpm dev
   ```

2. 打开浏览器控制台，检查是否有 Supabase 连接错误

3. 如果看到警告 "⚠️ Supabase 配置缺失"，请检查 `.env` 文件是否正确配置

## 使用说明

### 云同步功能

- **自动同步**：当配置了 Supabase 后，所有场景操作（创建、更新、删除）会自动同步到云端
- **离线优先**：即使云端同步失败，本地操作仍然可以正常进行
- **数据安全**：使用 Row Level Security (RLS) 确保用户只能访问自己的数据

### 手动控制云同步

```typescript
import { sceneApi } from '@/services/sceneApi'

// 禁用云同步
sceneApi.setCloudSyncEnabled(false)

// 启用云同步
sceneApi.setCloudSyncEnabled(true)

// 检查云同步状态
const isEnabled = sceneApi.isCloudSyncEnabled()
```

### 从云端获取数据

```typescript
// 从云端获取场景列表
const scenes = await sceneApi.getSceneList(true)

// 从云端获取单个场景
const scene = await sceneApi.getSceneById(id, true)
```

### 资产上传功能

系统已集成 Supabase Storage，支持上传模型和贴图纹理资产：

```typescript
import { useSceneStore } from '@/stores/modules/useScene.store'
import { assetApi } from '@/services/assetApi'

const sceneStore = useSceneStore()

// 上传资产到云端
const file = // ... 文件对象
const asset = await sceneStore.uploadAsset(file, 'model', sceneId)

// 或者直接使用 assetApi
const result = await assetApi.uploadAsset({
  file: file,
  type: 'model',
  sceneId: sceneId // 可选
})

// 批量上传
const results = await assetApi.uploadAssets([file1, file2], 'texture', sceneId)

// 删除资产
await assetApi.deleteAsset(asset)

// 检查资产是否存在
const exists = await assetApi.checkAssetExists(asset)
```

**支持的资产类型：**
- `model`: 3D 模型文件（.glb, .gltf 等）
- `texture`: 贴图纹理文件（.jpg, .png, .hdr 等）

**资产存储路径：**
- 如果指定了 `sceneId`：`scenes/{sceneId}/{assetId}/{fileName}`
- 如果未指定：`public/{assetId}/{fileName}`

## 故障排除

### 问题：无法连接到 Supabase

**解决方案：**
1. 检查 `.env` 文件中的 URL 和 Key 是否正确
2. 确保 URL 以 `https://` 开头
3. 检查网络连接

### 问题：权限错误

**解决方案：**
1. 确保已执行 `supabase-schema.sql` 脚本
2. 检查 RLS 策略是否正确设置
3. 如果使用认证，确保用户已登录

### 问题：数据同步失败

**解决方案：**
1. 检查浏览器控制台的错误信息
2. 确认 Supabase 项目状态正常
3. 检查网络连接

### 问题：资产上传失败（Row Level Security 错误）

**错误信息**：`new row violates row-level security policy`

**解决方案：**
1. 确认已创建名为 `assets` 的 Storage 存储桶
2. 确认存储桶设置为公开（Public bucket）
3. **最重要**：在 Storage → `assets` → Policies 中配置策略，允许匿名用户上传和读取文件（参考上面的"配置 Storage 策略"部分）
4. 检查文件大小是否超过限制
5. 检查浏览器控制台的错误信息
6. 确认 Supabase Storage 服务状态正常

## 下一步

- 添加用户认证界面
- 实现实时同步（使用 Supabase Realtime）
- 添加数据冲突解决策略
- 实现离线队列（当离线时缓存操作，上线后同步）
