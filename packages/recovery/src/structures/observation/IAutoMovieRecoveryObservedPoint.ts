/**
 * Provenance of an unchanged original current-cycle point.
 *
 * @evidence contracts/common.md#principled-implementation A discriminator and original point ordinal preserve the observed-point origin through cyclic transport.
 * @evidence contracts/common.md#clear-and-simple-design This named union arm is distinct from a point interpolated inside a PL edge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No interpolated point is relabelled as an original observation.
 * @evidence contracts/common.md#meaningful-documentation Defines the discriminator and zero-based original current-point address.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased provenance performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result owns this provenance record.
 */
export interface IAutoMovieRecoveryObservedPoint {
  /** The output point is one original current-cycle observation. */
  kind: "observed-point";

  /** Zero-based ordinal in the current input point array. */
  sourceIndex: number;
}
