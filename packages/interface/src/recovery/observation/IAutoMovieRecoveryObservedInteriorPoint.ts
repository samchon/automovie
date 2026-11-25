/** Provenance of a virtual canonical seam inside an observed PL edge. */
export interface IAutoMovieRecoveryObservedInteriorPoint {
  /** The point is interpolated inside an observed piecewise-linear edge. */
  kind: "observed-PL-interior";

  /** Oriented pair of zero-based original current-point ordinals. */
  sourceEdge: [number, number];

  /** Affine fraction strictly between 0 and 1 along sourceEdge. */
  fraction: number;
}
