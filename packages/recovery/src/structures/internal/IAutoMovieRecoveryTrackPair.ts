import type { matchRecoveryImageFeatures } from "../../internal/matchRecoveryImageFeatures";

/**
 * Frozen forward and reverse appearance matches for two input view indices.
 *
 * @evidence contracts/common.md#principled-implementation Both directed populations preserve the original feature indices and matcher scores for exact pair intersection.
 * @evidence contracts/common.md#clear-and-simple-design This internal record names the existing linker input without changing matching or geometric qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Appearance matches alone do not certify material identity or a three-dimensional point.
 * @evidence contracts/common.md#meaningful-documentation First and second are input view indices; each directed array uses its original query/target order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no matching.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The linker borrows both bounded match arrays for its call without retaining descriptors or external resources.
 */
export interface IAutoMovieRecoveryTrackPair {
  /** First view's index in the fixed input population. */
  first: number;

  /** Second view's index in the same input population. */
  second: number;

  /** Borrowed query-first to target-second feature matches. */
  forward: ReturnType<typeof matchRecoveryImageFeatures>;

  /** Borrowed query-second to target-first feature matches. */
  reverse: ReturnType<typeof matchRecoveryImageFeatures>;
}
