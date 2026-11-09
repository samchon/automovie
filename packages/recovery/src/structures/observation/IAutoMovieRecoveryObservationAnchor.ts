/**
 * One uniquely shared identity relating incoming and current observation cycles.
 *
 * @evidence contracts/development/design.md#principled-representation Original point ordinals and the retained incoming phase record the identity-based anchor relation without coordinate matching.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record binds one persistent identity across the two input populations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Repeated or missing identities cannot become a unique anchor through proximity matching.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes incoming and current zero-based indices from dimensionless phase.
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
