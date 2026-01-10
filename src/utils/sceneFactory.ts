import type { SceneObjectData } from '@/interfaces/sceneInterface.ts'
import type {
  GeometryData,
  BoxGeometryData,
  SphereGeometryData,
  CylinderGeometryData,
  ConeGeometryData,
  PlaneGeometryData,
  TorusGeometryData,
  TorusKnotGeometryData,
  PolyhedronGeometryData,
  CircleGeometryData,
  RingGeometryData,
  CapsuleGeometryData
} from '@/types/geometry'
import type {
  MaterialData,
  MeshBasicMaterialData,
  MeshLambertMaterialData,
  MeshPhongMaterialData,
  MeshStandardMaterialData,
  MeshPhysicalMaterialData,
  MeshToonMaterialData,
  MeshMatcapMaterialData,
  LineBasicMaterialData,
  LineDashedMaterialData,
  PointsMaterialData,
  SpriteMaterialData,
  ShadowMaterialData
} from '@/types/material'
import { MaterialSide, TextureFilter, TextureWrapping } from '@/types/material-types.ts'

export interface SceneObjectInput {
  id?: string
  type: SceneObjectData['type']
  name?: string
  parentId?: string
  mesh?: SceneObjectData['mesh']
  helper?: SceneObjectData['helper']
  transform?: Partial<SceneObjectData['transform']>
  visible?: SceneObjectData['visible']
  castShadow?: SceneObjectData['castShadow']
  receiveShadow?: SceneObjectData['receiveShadow']
  frustumCulled?: SceneObjectData['frustumCulled']
  renderOrder?: SceneObjectData['renderOrder']
  childrenIds?: SceneObjectData['childrenIds']
  userData?: SceneObjectData['userData']
}

function normalizeGeometry(input?: GeometryData): GeometryData {
  const twoPi = Math.PI * 2

  if (!input) {
    const fallback: BoxGeometryData = {
      type: 'box',
      width: 1,
      height: 1,
      depth: 1,
      widthSegments: 1,
      heightSegments: 1,
      depthSegments: 1
    }
    return fallback
  }

  switch (input.type) {
    case 'box': {
      const { type: _type, ...data } = input as BoxGeometryData
      const result: BoxGeometryData = {
        type: 'box',
        width: 1,
        height: 1,
        depth: 1,
        widthSegments: 1,
        heightSegments: 1,
        depthSegments: 1,
        ...data
      }
      return result
    }
    case 'sphere': {
      const { type: _type, ...data } = input as SphereGeometryData
      const result: SphereGeometryData = {
        type: 'sphere',
        radius: 1,
        widthSegments: 32,
        heightSegments: 16,
        phiStart: 0,
        phiLength: twoPi,
        thetaStart: 0,
        thetaLength: Math.PI,
        ...data
      }
      return result
    }
    case 'cylinder': {
      const { type: _type, ...data } = input as CylinderGeometryData
      const result: CylinderGeometryData = {
        type: 'cylinder',
        radiusTop: 1,
        radiusBottom: 1,
        height: 2,
        radialSegments: 32,
        heightSegments: 1,
        openEnded: false,
        thetaStart: 0,
        thetaLength: twoPi,
        ...data
      }
      return result
    }
    case 'cone': {
      const { type: _type, ...data } = input as ConeGeometryData
      const result: ConeGeometryData = {
        type: 'cone',
        radius: 1,
        height: 2,
        radialSegments: 32,
        heightSegments: 1,
        openEnded: false,
        thetaStart: 0,
        thetaLength: twoPi,
        ...data
      }
      return result
    }
    case 'plane': {
      const { type: _type, ...data } = input as PlaneGeometryData
      const result: PlaneGeometryData = {
        type: 'plane',
        width: 1,
        height: 1,
        widthSegments: 1,
        heightSegments: 1,
        ...data
      }
      return result
    }
    case 'torus': {
      const { type: _type, ...data } = input as TorusGeometryData
      const result: TorusGeometryData = {
        type: 'torus',
        radius: 1,
        tube: 0.4,
        radialSegments: 8,
        tubularSegments: 6,
        arc: twoPi,
        ...data
      }
      return result
    }
    case 'torusKnot': {
      const { type: _type, ...data } = input as TorusKnotGeometryData
      const result: TorusKnotGeometryData = {
        type: 'torusKnot',
        radius: 1,
        tube: 0.4,
        tubularSegments: 64,
        radialSegments: 8,
        p: 2,
        q: 3,
        ...data
      }
      return result
    }
    case 'tetrahedron':
    case 'octahedron':
    case 'dodecahedron':
    case 'icosahedron': {
      const { type: _type, ...data } = input as PolyhedronGeometryData
      const result: PolyhedronGeometryData = {
        type: input.type,
        radius: 1,
        detail: 0,
        ...data
      }
      return result
    }
    case 'circle': {
      const { type: _type, ...data } = input as CircleGeometryData
      const result: CircleGeometryData = {
        type: 'circle',
        radius: 1,
        segments: 8,
        thetaStart: 0,
        thetaLength: twoPi,
        ...data
      }
      return result
    }
    case 'ring': {
      const { type: _type, ...data } = input as RingGeometryData
      const result: RingGeometryData = {
        type: 'ring',
        innerRadius: 0.5,
        outerRadius: 1,
        thetaSegments: 8,
        phiSegments: 1,
        thetaStart: 0,
        thetaLength: twoPi,
        ...data
      }
      return result
    }
    case 'capsule': {
      const { type: _type, ...data } = input as CapsuleGeometryData
      const result: CapsuleGeometryData = {
        type: 'capsule',
        radius: 1,
        length: 1,
        capSegments: 4,
        radialSegments: 8,
        ...data
      }
      return result
    }
    default: {
      const fallback: BoxGeometryData = {
        type: 'box',
        width: 1,
        height: 1,
        depth: 1,
        widthSegments: 1,
        heightSegments: 1,
        depthSegments: 1
      }
      return fallback
    }
  }
}

function normalizeMaterial(input?: MaterialData): MaterialData {
  const baseDefaults = {
    color: '#ffffff',
    opacity: 1,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    renderOrder: 0,
    side: MaterialSide.Front,
    wireframe: false,
    wireframeLinewidth: 1,
    wrapS: TextureWrapping.ClampToEdge,
    wrapT: TextureWrapping.ClampToEdge,
    magFilter: TextureFilter.Linear,
    minFilter: TextureFilter.LinearMipmapLinear
  }

  if (!input) {
    const fallback: MeshStandardMaterialData = {
      type: 'standard',
      ...baseDefaults,
      emissive: '#000000',
      emissiveIntensity: 1,
      envMapIntensity: 1,
      normalScale: 1,
      displacementScale: 1,
      displacementBias: 0,
      aoMapIntensity: 1,
      roughness: 1,
      metalness: 0,
      alphaTest: false
    }
    return fallback
  }

  switch (input.type) {
    case 'basic': {
      const { type: _type, ...data } = input as MeshBasicMaterialData
      const result: MeshBasicMaterialData = {
        type: 'basic',
        ...baseDefaults,
        envMapIntensity: 1,
        ...data
      }
      return result
    }
    case 'lambert': {
      const { type: _type, ...data } = input as MeshLambertMaterialData
      const result: MeshLambertMaterialData = {
        type: 'lambert',
        ...baseDefaults,
        envMapIntensity: 1,
        normalScale: 1,
        displacementScale: 1,
        displacementBias: 0,
        emissive: '#000000',
        emissiveIntensity: 1,
        ...data
      }
      return result
    }
    case 'phong': {
      const { type: _type, ...data } = input as MeshPhongMaterialData
      const result: MeshPhongMaterialData = {
        type: 'phong',
        ...baseDefaults,
        envMapIntensity: 1,
        normalScale: 1,
        displacementScale: 1,
        displacementBias: 0,
        emissive: '#000000',
        emissiveIntensity: 1,
        specular: '#111111',
        shininess: 30,
        ...data
      }
      return result
    }
    case 'standard': {
      const { type: _type, ...data } = input as MeshStandardMaterialData
      const result: MeshStandardMaterialData = {
        type: 'standard',
        ...baseDefaults,
        emissive: '#000000',
        emissiveIntensity: 1,
        envMapIntensity: 1,
        normalScale: 1,
        displacementScale: 1,
        displacementBias: 0,
        aoMapIntensity: 1,
        roughness: 1,
        metalness: 0,
        alphaTest: false,
        ...data
      }
      return result
    }
    case 'physical': {
      const { type: _type, ...data } = input as MeshPhysicalMaterialData
      const result: MeshPhysicalMaterialData = {
        type: 'physical',
        ...baseDefaults,
        emissive: '#000000',
        emissiveIntensity: 1,
        envMapIntensity: 1,
        normalScale: 1,
        displacementScale: 1,
        displacementBias: 0,
        aoMapIntensity: 1,
        roughness: 1,
        metalness: 0,
        alphaTest: false,
        clearcoat: 0,
        clearcoatRoughness: 0,
        ior: 1.5,
        transmission: 0,
        thickness: 0.01,
        anisotropy: 0,
        anisotropyRotation: 0,
        clearcoatNormalScale: 1,
        ...data
      }
      return result
    }
    case 'toon': {
      const { type: _type, ...data } = input as MeshToonMaterialData
      const result: MeshToonMaterialData = {
        type: 'toon',
        ...baseDefaults,
        envMapIntensity: 1,
        normalScale: 1,
        displacementScale: 1,
        displacementBias: 0,
        ...data
      }
      return result
    }
    case 'matcap': {
      const { type: _type, ...data } = input as MeshMatcapMaterialData
      const result: MeshMatcapMaterialData = {
        type: 'matcap',
        ...baseDefaults,
        ...data
      }
      return result
    }
    case 'lineBasic': {
      const { type: _type, ...data } = input as LineBasicMaterialData
      const result: LineBasicMaterialData = {
        type: 'lineBasic',
        ...baseDefaults,
        linewidth: 1,
        linecap: 'round',
        linejoin: 'round',
        ...data
      }
      return result
    }
    case 'lineDashed': {
      const { type: _type, ...data } = input as LineDashedMaterialData
      const result: LineDashedMaterialData = {
        type: 'lineDashed',
        ...baseDefaults,
        linewidth: 1,
        linecap: 'round',
        linejoin: 'round',
        dashSize: 3,
        gapSize: 1,
        scale: 1,
        ...data
      }
      return result
    }
    case 'points': {
      const { type: _type, ...data } = input as PointsMaterialData
      const result: PointsMaterialData = {
        type: 'points',
        ...baseDefaults,
        size: 1,
        sizeAttenuation: true,
        ...data
      }
      return result
    }
    case 'sprite': {
      const { type: _type, ...data } = input as SpriteMaterialData
      const result: SpriteMaterialData = {
        type: 'sprite',
        ...baseDefaults,
        ...data
      }
      return result
    }
    case 'shadow': {
      const { type: _type, ...data } = input as ShadowMaterialData
      const result: ShadowMaterialData = {
        type: 'shadow',
        ...baseDefaults,
        ...data
      }
      return result
    }
    default: {
      const fallback: MeshStandardMaterialData = {
        type: 'standard',
        ...baseDefaults,
        emissive: '#000000',
        emissiveIntensity: 1,
        envMapIntensity: 1,
        normalScale: 1,
        displacementScale: 1,
        displacementBias: 0,
        aoMapIntensity: 1,
        roughness: 1,
        metalness: 0,
        alphaTest: false
      }
      return fallback
    }
  }
}

export function createDefaultMaterialData(type: MaterialData['type']): MaterialData {
  return normalizeMaterial({ type } as MaterialData)
}

export function createSceneObjectData(input: SceneObjectInput): SceneObjectData {
  const mesh = input.type === 'mesh'
    ? {
      geometry: normalizeGeometry(input.mesh?.geometry),
      material: normalizeMaterial(input.mesh?.material)
    }
    : input.mesh

  return {
    id: input.id ?? '',
    type: input.type,
    name: input.name,
    parentId: input.parentId,
    mesh,
    helper: input.helper,
    transform: {
      position: input.transform?.position ?? [0, 0, 0],
      rotation: input.transform?.rotation ?? [0, 0, 0],
      scale: input.transform?.scale ?? [1, 1, 1]
    },
    visible: input.visible ?? true,
    castShadow: input.castShadow ?? false,
    receiveShadow: input.receiveShadow ?? false,
    frustumCulled: input.frustumCulled ?? true,
    renderOrder: input.renderOrder ?? 0,
    childrenIds: input.childrenIds ?? [],
    userData: input.userData ?? {}
  }
}
