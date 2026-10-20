/**
 * One uniquely shared identity relating incoming and current observation cycles.
 *
 * @evidence contracts/common.md#principled-implementation Original point ordinals and the retained incoming phase record the identity-based anchor relation without coordinate matching.
 * @evidence contracts/common.md#clear-and-simple-design One record binds one persistent identity across the two input populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated or missing identities cannot become a unique anchor through proximity matching.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes incoming and current zero-based indices from dimensionless phase.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased anchor performs no matching.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transport result owns the anchor record.
 */
export interface IAutoMovieRecoveryObservationAnchor {
  /** Identity appearing exactly once in each input cycle. */
  id: string;

  /** Zero-based point ordinal in the incoming cycle. */
  previousIndex: number;

  /** Retained incoming canonical phase in [0, 1). */
  phase: number;

  /** Zero-based point ordinal in the original current cycle, before transport ordering. */
  currentIndex: number;
}
