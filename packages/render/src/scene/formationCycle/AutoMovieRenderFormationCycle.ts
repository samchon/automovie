import type * as THREE from "three";
import { isAutoMovieFormationCycleMaterial as isAutoMovieFormationCycleMaterialImplementation } from "../internal/isAutoMovieFormationCycleMaterial.js";
import { selectFormationShadowPalette as selectFormationShadowPaletteImplementation } from "../internal/selectFormationShadowPalette.js";

/** Public operations for Auto Movie Render Formation Cycle. */
export namespace AutoMovieRenderFormationCycle {
  /**
   * Whether a material carries the formation cycle's shader patch, whatever other
   * patches it carries beside it.
   */
  export function isAutoMovieFormationCycleMaterial(material: THREE.Material): boolean {
    return isAutoMovieFormationCycleMaterialImplementation(material);
  }

  /**
   * The palette material a formation's shadow draw stands for: the material of
   * the geometry group three's shadow map is drawing, or the first palette entry
   * for an ungrouped draw or a group the geometry does not hold.
   *
   * Three passes the drawn entry of `geometry.groups`, or null, typed as a
   * `THREE.Group | THREE.GeometryGroup | null`; only an entry of the geometry's
   * own groups selects a palette material.
   */
  export function selectFormationShadowPalette(geometry: THREE.BufferGeometry, palette: readonly THREE.Material[], group: THREE.Group | THREE.GeometryGroup | null): THREE.Material {
    return selectFormationShadowPaletteImplementation(geometry, palette, group);
  }
}
