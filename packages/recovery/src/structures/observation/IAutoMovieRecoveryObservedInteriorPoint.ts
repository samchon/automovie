/**
 * Provenance of a virtual canonical seam inside an observed PL edge.
 *
 * @evidence contracts/common.md#principled-implementation An oriented original edge and a strict interior affine fraction identify the inferred point without creating a new source observation.
 * @evidence contracts/common.md#clear-and-simple-design This named provenance arm separates interpolation from original-point identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The point is not a measured material point or an inferred source guide.
 * @evidence contracts/common.md#meaningful-documentation Defines original edge ordinals, orientation and dimensionless interior fraction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased provenance performs no interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result owns this provenance record.
 */
export interface IAutoMovieRecoveryObservedInteriorPoint {
  /** The point is interpolated inside an observed piecewise-linear edge. */
  kind: "observed-PL-interior";

  /** Oriented pair of zero-based original current-point ordinals. */
  sourceEdge: [number, number];

  /** Affine fraction strictly between 0 and 1 along sourceEdge. */
  fraction: number;
}
