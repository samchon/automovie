/**
 * Provenance of an unchanged original current-cycle point.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminator and original point ordinal preserve the observed-point origin through cyclic transport.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This named union arm is distinct from a point interpolated inside a PL edge.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No interpolated point is relabelled as an original observation.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the discriminator and zero-based original current-point address.
 */
export interface IAutoMovieRecoveryObservedPoint {
  /** The output point is one original current-cycle observation. */
  kind: "observed-point";

  /** Zero-based ordinal in the current input point array. */
  sourceIndex: number;
}
