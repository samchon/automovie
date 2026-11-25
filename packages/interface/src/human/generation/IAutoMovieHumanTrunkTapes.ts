/**
 * Planar trunk tape samples and the trial-half-width girth reader used by the
 * solve. Runtime construction and admission remain with
 * AutoMovieHumanTrunkTapes in Human.
 */
export namespace IAutoMovieHumanTrunkTapes {
  /**
   * Planar body-frame [x, z] section samples in calibration millimetres after
   * the reliefs reaching that height have displaced their points.
   */
  export type PointsResult = [number, number][];

  /**
   * Borrowed planar [x, z] samples in calibration millimetres whose convex-hull
   * perimeter defines the trunk tape. Point order is not a polygon-winding
   * requirement.
   */
  export type HullPoints = readonly [number, number][];

  /**
   * Read the section's tape girth in millimetres at a trial half width in
   * millimetres. The caller owns the target tape, initial guess and root
   * solve.
   */
  export type SolveGirth = (width: number) => number;
}
