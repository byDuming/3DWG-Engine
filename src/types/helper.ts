// Helper object data definitions covering common Three.js helpers
export type HelperData =
  | AxesHelperData
  | GridHelperData
  | PolarGridHelperData
  | ArrowHelperData
  | BoxHelperData
  | Box3HelperData
  | CameraHelperData
  | DirectionalLightHelperData
  | HemisphereLightHelperData
  | PointLightHelperData
  | SpotLightHelperData
  | RectAreaLightHelperData
  | PlaneHelperData
  | SkeletonHelperData
  | LightProbeHelperData
  | VertexNormalsHelperData

interface BaseHelperData {
  /** Helper type identifier */
  type: string
  /** Optional readable name */
  name?: string
}

interface TargetedHelperData extends BaseHelperData {
  /** Scene object ID the helper should visualize */
  targetId?: string
}

export interface AxesHelperData extends BaseHelperData {
  type: 'axes'
  size?: number
}

export interface GridHelperData extends BaseHelperData {
  type: 'grid'
  size?: number
  divisions?: number
  colorCenterLine?: string
  colorGrid?: string
}

export interface PolarGridHelperData extends BaseHelperData {
  type: 'polarGrid'
  radius?: number
  radials?: number
  circles?: number
  divisions?: number
  color1?: string
  color2?: string
}

export interface ArrowHelperData extends TargetedHelperData {
  type: 'arrow'
  dir?: [number, number, number]
  origin?: [number, number, number]
  length?: number
  color?: string
  headLength?: number
  headWidth?: number
}

export interface BoxHelperData extends TargetedHelperData {
  type: 'box'
  color?: string
}

export interface Box3HelperData extends BaseHelperData {
  type: 'box3'
  min?: [number, number, number]
  max?: [number, number, number]
  color?: string
}

export interface CameraHelperData extends TargetedHelperData {
  type: 'camera'
}

export interface DirectionalLightHelperData extends TargetedHelperData {
  type: 'directionalLight'
  size?: number
  color?: string
}

export interface HemisphereLightHelperData extends TargetedHelperData {
  type: 'hemisphereLight'
  size?: number
  color?: string
}

export interface PointLightHelperData extends TargetedHelperData {
  type: 'pointLight'
  sphereSize?: number
  color?: string
}

export interface SpotLightHelperData extends TargetedHelperData {
  type: 'spotLight'
  color?: string
}

export interface RectAreaLightHelperData extends TargetedHelperData {
  type: 'rectAreaLight'
  color?: string
}

export interface PlaneHelperData extends BaseHelperData {
  type: 'plane'
  size?: number
  color?: string
  normal?: [number, number, number]
  constant?: number
}

export interface SkeletonHelperData extends TargetedHelperData {
  type: 'skeleton'
}

export interface LightProbeHelperData extends TargetedHelperData {
  type: 'lightProbe'
  size?: number
}

export interface VertexNormalsHelperData extends TargetedHelperData {
  type: 'vertexNormals'
  size?: number
  color?: string
}
