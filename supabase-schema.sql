-- Supabase 数据库表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 创建 scenes 表
CREATE TABLE IF NOT EXISTS scenes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  a_ids INTEGER NOT NULL DEFAULT 3,
  version INTEGER NOT NULL DEFAULT 1,
  object_data_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  renderer_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS scenes_user_id_idx ON scenes(user_id);
CREATE INDEX IF NOT EXISTS scenes_updated_at_idx ON scenes(updated_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许匿名访问（适合面试/演示项目）
CREATE POLICY "Allow anonymous access"
  ON scenes FOR ALL
  USING (true)
  WITH CHECK (true);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
