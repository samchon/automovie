import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Source-owned cyclic ring mutated by interaction refinement. Callers provide
 * finite admitted noncollapsed boundary samples in a common millimetre frame;
 * this structural view does not perform geometric admission.
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
  /**
   * Declared signed winding governing boundary order; this number is not
   * inferred from a fresh polygon area computation.
   */
  winding: number;
}
