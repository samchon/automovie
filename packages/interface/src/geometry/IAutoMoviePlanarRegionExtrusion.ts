import type { IAutoMoviePlanarRegion } from "./IAutoMoviePlanarRegion";

/**
 * A planar region extruded symmetrically about its local XY plane.
 *
 * The Engine's planar-region extruder admits the rings and passes each void
 * through the full depth. The caps lie at local Z = ±depth/2.
 */
export interface IAutoMoviePlanarRegionExtrusion extends IAutoMoviePlanarRegion {
  /** Positive extrusion depth along local Z, in metres. */
  depth: number;
}
