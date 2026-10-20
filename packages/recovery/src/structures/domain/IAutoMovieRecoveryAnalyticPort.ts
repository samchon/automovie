/**
 * A named saved curve occupying one oriented end of an analytic domain.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/common.md#clear-and-simple-design This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime admission and realization own computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and immutable recipe arrays.
 */
export interface IAutoMovieRecoveryAnalyticPort {
  /** Saved coefficient curve identity. */
  curveName: string;

  /** Lower or upper end in the declared native chart; not a world-space height classification. */
  side: "lower" | "upper";
}
