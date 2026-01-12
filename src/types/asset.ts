export type AssetType = 'model'
export type AssetSource = 'local' | 'remote'

export type AssetRef = {
  id: string
  type: AssetType
  uri: string
  name: string
  source: AssetSource
  meta?: {
    ext?: string
    size?: number
    mime?: string
  }
  createdAt?: number
}
