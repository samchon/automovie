import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Source-owned cyclic ring refined in place. Supply admitted finite boundary
 * samples from the same planar millimetre frame as the other selected rings.
 */
export interface IAutoMovieRefineContourInteractions64Ring {
  /**
   * Stable generated ring identity retained while its shared source
   * restrictions are refined.
   */
  id: string;
  /**
   * Mutable cyclic millimetre samples. The register callback and ring splice
   * share new source-derived knots across all consumers of this ring object.
   */
  points: AutoMovieVector3Tuple[];
  /** Authored signed winding used when inserting knots into the cyclic order. */
  winding: number;
}
