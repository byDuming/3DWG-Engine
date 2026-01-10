/**
 * 几何体数据联合类型，涵盖所有基础几何体
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

export const geometryTypeOptions = [
  { label: '正方体', value: 'box' },
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
  { label: '环形', value: 'ring' }
]

interface BaseGeometryData {
  /**
   * 几何体类型标识
   * @required
   */
  type: string
  /**
   * 可选名称（用于识别）
   */
  name?: string
}

interface SegmentedRadialGeometry extends BaseGeometryData {
  /**
   * 径向分段数
   * @default 8
   * @minimum 1
   */
  radialSegments?: number
  /**
   * 高度方向分段数
   * @default 1
   * @minimum 1
   */
  heightSegments?: number
  /**
   * 是否打开两端
   * @default false
   * @description true 表示顶部/底部敞开
   */
  openEnded?: boolean
  /**
   * 起始角度（弧度）
   * @default 0
   * @minimum 0
   * @maximum Math.PI * 2
   */
  thetaStart?: number
  /**
   * 扫描角度（弧度）
   * @default Math.PI * 2
   * @minimum 0
   * @maximum Math.PI * 2
   */
  thetaLength?: number
}

export interface BoxGeometryData extends BaseGeometryData {
  type: 'box'
  /**
   * 宽度
   * @default 1
   * @minimum 0.01
   */
  width?: number
  /**
   * 高度
   * @default 1
   * @minimum 0.01
   */
  height?: number
  /**
   * 深度
   * @default 1
   * @minimum 0.01
   */
  depth?: number
  /**
   * 宽度分段
   * @default 1
   * @minimum 1
   */
  widthSegments?: number
  /**
   * 高度分段
   * @default 1
   * @minimum 1
   */
  heightSegments?: number
  /**
   * 深度分段
   * @default 1
   * @minimum 1
   */
  depthSegments?: number
}

export interface SphereGeometryData extends BaseGeometryData {
  type: 'sphere'
  /**
   * 半径
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 水平分段（经线）
   * @default 32
   * @minimum 3
   */
  widthSegments?: number
  /**
   * 垂直分段（纬线）
   * @default 16
   * @minimum 2
   */
  heightSegments?: number
  /**
   * 水平起始角度（弧度）
   * @default 0
   * @minimum 0
   * @maximum Math.PI * 2
   */
  phiStart?: number
  /**
   * 水平扫描角度（弧度）
   * @default Math.PI * 2
   * @minimum 0
   * @maximum Math.PI * 2
   */
  phiLength?: number
  /**
   * 垂直起始角度（弧度）
   * @default 0
   * @minimum 0
   * @maximum Math.PI
   */
  thetaStart?: number
  /**
   * 垂直扫描角度（弧度）
   * @default Math.PI
   * @minimum 0
   * @maximum Math.PI
   */
  thetaLength?: number
}

export interface CylinderGeometryData extends SegmentedRadialGeometry {
  type: 'cylinder'
  /**
   * 顶部半径（0 可做圆锥台）
   * @default 1
   * @minimum 0
   */
  radiusTop?: number
  /**
   * 底部半径
   * @default 1
   * @minimum 0
   */
  radiusBottom?: number
  /**
   * 高度
   * @default 2
   * @minimum 0.01
   */
  height?: number
}

export interface ConeGeometryData extends SegmentedRadialGeometry {
  type: 'cone'
  /**
   * 底面半径
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 高度
   * @default 2
   * @minimum 0.01
   */
  height?: number
}

export interface PlaneGeometryData extends BaseGeometryData {
  type: 'plane'
  /**
   * 平面宽度
   * @default 1
   * @minimum 0.01
   */
  width?: number
  /**
   * 平面高度
   * @default 1
   * @minimum 0.01
   */
  height?: number
  /**
   * 宽度分段
   * @default 1
   * @minimum 1
   * @maximum 128
   */
  widthSegments?: number
  /**
   * 高度分段
   * @default 1
   * @minimum 1
   * @maximum 128
   */
  heightSegments?: number
}

export interface TorusGeometryData extends BaseGeometryData {
  type: 'torus'
  /**
   * 主半径（中心到管道中心）
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 管道半径
   * @default 0.4
   * @minimum 0.01
   */
  tube?: number
  /**
   * 管道截面分段
   * @default 8
   * @minimum 3
   * @maximum 32
   */
  radialSegments?: number
  /**
   * 圆环方向分段
   * @default 6
   * @minimum 3
   * @maximum 64
   */
  tubularSegments?: number
  /**
   * 圆弧角度（弧度）
   * @default Math.PI * 2
   * @minimum 0
   * @maximum Math.PI * 2
   * @description 用于创建不完整的圆环
   */
  arc?: number
}

export interface TorusKnotGeometryData extends BaseGeometryData {
  type: 'torusKnot'
  /**
   * 主半径
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 管道半径
   * @default 0.4
   * @minimum 0.01
   */
  tube?: number
  /**
   * 管道分段
   * @default 64
   * @minimum 8
   * @maximum 256
   */
  tubularSegments?: number
  /**
   * 管道截面分段
   * @default 8
   * @minimum 3
   * @maximum 32
   */
  radialSegments?: number
  /**
   * 围绕中心轴圈数（p）
   * @default 2
   * @minimum 1
   * @maximum 10
   */
  p?: number
  /**
   * 自身扭转圈数（q）
   * @default 3
   * @minimum 1
   * @maximum 10
   */
  q?: number
}

export interface PolyhedronGeometryData extends BaseGeometryData {
  type: 'tetrahedron' | 'octahedron' | 'dodecahedron' | 'icosahedron'
  /**
   * 外接球半径
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 细分等级
   * @default 0
   * @minimum 0
   * @maximum 5
   * @description 值越大表面越光滑，但顶点数指数增长
   */
  detail?: number
}

export interface CircleGeometryData extends BaseGeometryData {
  type: 'circle'
  /**
   * 圆半径
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 分段数
   * @default 8
   * @minimum 3
   * @maximum 128
   */
  segments?: number
  /**
   * 起始角度（弧度）
   * @default 0
   * @minimum 0
   * @maximum Math.PI * 2
   */
  thetaStart?: number
  /**
   * 扫描角度（弧度）
   * @default Math.PI * 2
   * @minimum 0
   * @maximum Math.PI * 2
   * @description 用于创建扇形
   */
  thetaLength?: number
}

export interface RingGeometryData extends BaseGeometryData {
  type: 'ring'
  /**
   * 内半径
   * @default 0.5
   * @minimum 0
   */
  innerRadius?: number
  /**
   * 外半径
   * @default 1
   * @minimum 0.01
   */
  outerRadius?: number
  /**
   * 圆周分段数
   * @default 8
   * @minimum 3
   * @maximum 128
   */
  thetaSegments?: number
  /**
   * 径向分段数
   * @default 1
   * @minimum 1
   * @maximum 32
   */
  phiSegments?: number
  /**
   * 起始角度（弧度）
   * @default 0
   * @minimum 0
   * @maximum Math.PI * 2
   */
  thetaStart?: number
  /**
   * 扫描角度（弧度）
   * @default Math.PI * 2
   * @minimum 0
   * @maximum Math.PI * 2
   * @description 用于创建扇形环面
   */
  thetaLength?: number
}

export interface CapsuleGeometryData extends BaseGeometryData {
  type: 'capsule'
  /**
   * 胶囊半径
   * @default 1
   * @minimum 0.01
   */
  radius?: number
  /**
   * 中段长度
   * @default 1
   * @minimum 0
   */
  length?: number
  /**
   * 端帽分段
   * @default 4
   * @minimum 1
   * @maximum 16
   */
  capSegments?: number
  /**
   * 径向分段
   * @default 8
   * @minimum 3
   * @maximum 32
   */
  radialSegments?: number
}
