/**
 * 几何体数据类型定义与选项列表。
 */
export type GeometryData =
  | BoxGeometryData
  | SphereGeometryData
  | CylinderGeometryData
  | ConeGeometryData
  | PlaneGeometryData
  | TorusGeometryData
  | TorusKnotGeometryData
  | PolyhedronGeometryData
  | CircleGeometryData
  | RingGeometryData
  | CapsuleGeometryData
  | SpriteGeometryData

export type GeometryType = GeometryData['type']

export const geometryTypeOptions: Array<{ label: string; value: GeometryType }> = [
  { label: '立方体', value: 'box' },
  { label: '胶囊', value: 'capsule' },
  { label: '球体', value: 'sphere' },
  { label: '圆柱体', value: 'cylinder' },
  { label: '圆锥体', value: 'cone' },
  { label: '平面', value: 'plane' },
  { label: '圆环', value: 'torus' },
  { label: '环面扭结', value: 'torusKnot' },
  { label: '四面体', value: 'tetrahedron' },
  { label: '八面体', value: 'octahedron' },
  { label: '十二面体', value: 'dodecahedron' },
  { label: '二十面体', value: 'icosahedron' },
  { label: '圆', value: 'circle' },
  { label: '环形', value: 'ring' },
  { label: '精灵', value: 'sprite' }
]

interface BaseGeometryData {
  type: string
  name?: string
}

interface SegmentedRadialGeometry extends BaseGeometryData {
  radialSegments?: number
  heightSegments?: number
  openEnded?: boolean
  thetaStart?: number
  thetaLength?: number
}

export interface BoxGeometryData extends BaseGeometryData {
  type: 'box'
  width?: number
  height?: number
  depth?: number
  widthSegments?: number
  heightSegments?: number
  depthSegments?: number
}

export interface SphereGeometryData extends BaseGeometryData {
  type: 'sphere'
  radius?: number
  widthSegments?: number
  heightSegments?: number
  phiStart?: number
  phiLength?: number
  thetaStart?: number
  thetaLength?: number
}

export interface CylinderGeometryData extends SegmentedRadialGeometry {
  type: 'cylinder'
  radiusTop?: number
  radiusBottom?: number
  height?: number
}

export interface ConeGeometryData extends SegmentedRadialGeometry {
  type: 'cone'
  radius?: number
  height?: number
}

export interface PlaneGeometryData extends BaseGeometryData {
  type: 'plane'
  width?: number
  height?: number
  widthSegments?: number
  heightSegments?: number
}

export interface TorusGeometryData extends BaseGeometryData {
  type: 'torus'
  radius?: number
  tube?: number
  radialSegments?: number
  tubularSegments?: number
  arc?: number
}

export interface TorusKnotGeometryData extends BaseGeometryData {
  type: 'torusKnot'
  radius?: number
  tube?: number
  tubularSegments?: number
  radialSegments?: number
  p?: number
  q?: number
}

export interface PolyhedronGeometryData extends BaseGeometryData {
  type: 'tetrahedron' | 'octahedron' | 'dodecahedron' | 'icosahedron'
  radius?: number
  detail?: number
}

export interface CircleGeometryData extends BaseGeometryData {
  type: 'circle'
  radius?: number
  segments?: number
  thetaStart?: number
  thetaLength?: number
}

export interface RingGeometryData extends BaseGeometryData {
  type: 'ring'
  innerRadius?: number
  outerRadius?: number
  thetaSegments?: number
  phiSegments?: number
  thetaStart?: number
  thetaLength?: number
}

export interface CapsuleGeometryData extends BaseGeometryData {
  type: 'capsule'
  radius?: number
  length?: number
  capSegments?: number
  radialSegments?: number
}

export interface SpriteGeometryData extends BaseGeometryData {
  type: 'sprite'
}
