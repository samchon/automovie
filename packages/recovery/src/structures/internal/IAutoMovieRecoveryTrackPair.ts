import type { matchRecoveryImageFeatures } from "../../internal/matchRecoveryImageFeatures";

/**
 * Frozen forward and reverse appearance matches for two input view indices.
 *
 * @evidence contracts/development/design.md#principled-representation Both directed populations preserve the original feature indices and matcher scores for exact pair intersection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This internal record names the existing linker input without changing matching or geometric qualification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Appearance matches alone do not certify material identity or a three-dimensional point.
 * @evidence contracts/development/common.md#meaningful-documentation First and second are input view indices; each directed array uses its original query/target order.
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
