import type { GeometryData } from "../types/geometry";
import type { HelperData } from "../types/helper";
import type { MaterialData } from "../types/material";

/**
 * Scene object definition kept in the store and synchronized to Three.js.
 */
export interface SceneObjectData {
  id: string;
  name?: string;
  type: 'mesh' | 'model' | 'light' | 'camera' | 'group' | 'empty' | 'helper' | 'scene';

  /**
   * Reference to an external asset (not full data).
   */
  assetId?: string;

  /**
   * Mesh configuration when the type is `mesh`.
   */
  mesh?: {
    geometry: GeometryData;
    material: MaterialData;
  };

  /**
   * Helper configuration when the type is `helper`.
   */
  helper?: HelperData;

  /**
   * Core transform (always stored).
   */
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };

  // ==================== Render state ====================

  /**
   * Whether the object is visible.
   * @default true
   */
  visible?: boolean;

  /**
   * Whether the object casts shadows.
   * @default true
   */
  castShadow?: boolean;

  /**
   * Whether the object receives shadows.
   * @default true
   */
  receiveShadow?: boolean;

  /**
   * Whether frustum culling is enabled.
   * @default true
   */
  frustumCulled?: boolean;

  /**
   * Render order; larger renders later.
   * @default 0
   */
  renderOrder?: number;

  /**
   * Parent object ID.
   */
  parentId?: string;

  /**
   * Child object ID list.
   */
  childrenIds?: string[];

  // ==================== User data ====================

  userData?: Record<string, any>;
}
