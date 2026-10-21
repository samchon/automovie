/**
 * Checked fixed fit resource envelope for optional lagged curvature.
 *
 * @evidence contracts/common.md#principled-implementation Nonnegative dimensions and checked monotone polynomial bounds admit seed overlap, local formation, factor/row buffers and subsequent generic retention under unchanged owner ceilings.
 * @evidence contracts/common.md#clear-and-simple-design One fit admission supplies fixed retainedEntries and per-attempt work; model construction and accepted copying keep their separate charges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Eligibility does not assert auxiliary qualification, factor support, milliseconds or convergence. Capacity absence preserves GN without allocating optional numerical buffers.
 * @evidence contracts/common.md#meaningful-documentation Entries are logical scalar slots, while work is prepaid visits. The conservative A reservation remains during generic/auxiliary/terminal work even after unused buffers expire.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record computes no bounds.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed metadata belongs to F; no state, design, scale array, seed or factor is retained by admission.
 */
export interface IAutoMovieRecoveryCurvatureAdmission {
  /** Whether optional seed/numerical buffers fit both resident and materialization limits. */
  eligible: boolean;

  /** Base plus F and, when eligible, the complete S+A reservation. */
  retainedEntries: number;

  /** Full unrefunded work charge for each eligible seeded existing model. */
  work: number;
}
