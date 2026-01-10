// ==================== 常量定义（编译后会被擦除） ====================

/**
 * 材质混合模式常量
 */
export const MaterialBlending = {
  Normal: 'normal',
  Additive: 'additive',
  Subtractive: 'subtractive',
  Multiply: 'multiply',
  Custom: 'custom'
} as const;

/**
 * 材质混合模式类型
 */
export type MaterialBlendingType = typeof MaterialBlending[keyof typeof MaterialBlending];

/**
 * 材质渲染面常量
 */
export const MaterialSide = {
  Front: 'front',
  Back: 'back',
  Double: 'double'
} as const;

/**
 * 材质渲染面类型
 */
export type MaterialSideType = typeof MaterialSide[keyof typeof MaterialSide];

/**
 * 深度函数常量
 */
export const DepthFunc = {
  Never: 'never',
  Always: 'always',
  Less: 'less',
  LessEqual: 'lequal',
  Equal: 'equal',
  GreaterEqual: 'gequal',
  Greater: 'greater',
  NotEqual: 'notequal'
} as const;

/**
 * 深度函数类型
 */
export type DepthFuncType = typeof DepthFunc[keyof typeof DepthFunc];

/**
 * 纹理包装模式常量
 */
export const TextureWrapping = {
  Repeat: 'repeat',
  ClampToEdge: 'clampToEdge',
  MirroredRepeat: 'mirroredRepeat'
} as const;

/**
 * 纹理包装模式类型
 */
export type TextureWrappingType = typeof TextureWrapping[keyof typeof TextureWrapping];

/**
 * 纹理过滤模式常量
 */
export const TextureFilter = {
  Nearest: 'nearest',
  Linear: 'linear',
  NearestMipmapNearest: 'nearestMipmapNearest',
  LinearMipmapNearest: 'linearMipmapNearest',
  NearestMipmapLinear: 'nearestMipmapLinear',
  LinearMipmapLinear: 'linearMipmapLinear'
} as const;

/**
 * 纹理过滤模式类型
 */
export type TextureFilterType = typeof TextureFilter[keyof typeof TextureFilter];

// ==================== 使用示例 ====================

// 1. 在接口中使用
export interface MaterialOptions {
  /** 
   * 材质混合模式
   * @default MaterialBlending.Normal
   */
  blending?: MaterialBlendingType;
  
  /** 
   * 材质渲染面
   * @default MaterialSide.Front
   */
  side?: MaterialSideType;
  
  /** 
   * 深度测试函数
   * @default DepthFunc.Less
   */
  depthFunc?: DepthFuncType;
}