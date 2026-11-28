import type { IAutoMoviePlanarRegion } from "./IAutoMoviePlanarRegion";

/**
 * A planar region and thickness for a symmetric local-Z extrusion, including
 * through-holes.
 *
 * Each hole extends through the entire thickness. The resulting mesh has
 * separate cap and wall corners for sharp creases and metric texture
 * coordinates.
 */
export interface IAutoMoviePlanarRegionExtrusion extends IAutoMoviePlanarRegion {
  /**
   * Positive finite depth in metres along local Z. The caps are placed at the
   * negative and positive half-depth. Supply a half-depth that remains nonzero
   * when represented.
   */
  depth: number;
}
