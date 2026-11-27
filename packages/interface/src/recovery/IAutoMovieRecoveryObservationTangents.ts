import type { AutoMovieVector3Tuple } from "..";

/**
 * Unit directions away from one point on either side of an oriented observation
 * cycle.
 */
export interface IAutoMovieRecoveryObservationTangents {
  /** Unit direction from the point toward increasing traversal phase. */
  out: Readonly<AutoMovieVector3Tuple>;

  /**
   * Unit direction from the point toward the preceding traversal point,
   * opposite the forward incoming derivative.
   */
  incoming: Readonly<AutoMovieVector3Tuple>;
}
