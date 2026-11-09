/**
 * Provenance of a virtual canonical seam inside an observed PL edge.
 *
 * @evidence contracts/development/design.md#principled-representation An oriented original edge and a strict interior affine fraction identify the inferred point without creating a new source observation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This named provenance arm separates interpolation from original-point identity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is not a measured material point or an inferred source guide.
 * @evidence contracts/development/common.md#meaningful-documentation Defines original edge ordinals, orientation and dimensionless interior fraction.
 */
export interface IAutoMovieRecoveryObservedInteriorPoint {
  /** The point is interpolated inside an observed piecewise-linear edge. */
  kind: "observed-PL-interior";

  /** Oriented pair of zero-based original current-point ordinals. */
  sourceEdge: [number, number];

  /** Affine fraction strictly between 0 and 1 along sourceEdge. */
  fraction: number;
}
