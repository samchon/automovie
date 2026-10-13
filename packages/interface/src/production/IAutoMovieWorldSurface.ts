import { IAutoMovieHeightRule } from "../geometry/IAutoMovieHeightRule";

/**
 * Bounded world-XZ polygon with a deterministic terrain height law and explicit traversability.
 *
 * @evidence contracts/common.md#principled-implementation A finite simple nonzero-area polygon admits ground containment, and the selected height rule supplies world-meter elevation; engine ground queries use the first containing surface in declared world order.
 * @evidence contracts/common.md#clear-and-simple-design Footprint, height and walkability keep geometric sampling distinct from performer permission without baking terrain into dense mesh samples in this contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-intersections, repeated invalid vertices and zero area refuse; no containing surface means the ground-query absence result rather than fabricated walkable terrain.
 * @evidence contracts/common.md#meaningful-documentation Defines stable id, simple XZ polygon requirements, meter coordinates, height-law ownership and explicit walkability.
 * @author Samchon
 */
export interface IAutoMovieWorldSurface {
  /** Stable surface id. */
  id: string;

  /**
   * At least three distinct finite XZ vertices forming a simple, non-self-intersecting polygon with non-zero area.
   */
  polygon: Array<{
    /** World X in meters. */
    x: number;

    /** World Z in meters. */
    z: number;
  }>;

  /** Surface height function. */
  height: IAutoMovieHeightRule;

  /** Whether performers may traverse the surface. */
  walkable: boolean;
}
