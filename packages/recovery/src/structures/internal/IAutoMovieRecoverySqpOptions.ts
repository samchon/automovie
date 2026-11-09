/**
 * Optional original-design working-space and arc limits.
 *
 * @evidence contracts/development/design.md#principled-representation A full untilted convex-QP certificate may accelerate an already qualified tilted direction; it cannot supply nonlinear stationarity or data rank.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The owner supplies its existing singular, entry and resident limits; no new outer trial allowance is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported working spaces retain the original direction, never a successful initial-state fallback or a relaxed observation.
 * @evidence contracts/development/common.md#meaningful-documentation Members separate existing factor limits, owner retention and per-model conservative work.
 */
export interface IAutoMovieRecoverySqpOptions {
  /** Existing Jacobi sweep ceiling for the optional thin working transpose. */
  maxSweeps: number;

  /** Required independent original working-row singular ratio, without floors. */
  minimumSingularRatio: number;

  /** Input plus simultaneous numerical scalar slots, excluding JS object overhead and fixed refusal metadata. */
  maxEntries: number;

  /** Total owner ceiling, including its current metric, rows and detached states. */
  maxResidentEntries: number;

  /** Owner's already admitted simultaneous population, before optional arrays. */
  retainedEntries: number;

  /** Remaining conservative scalar visits in this model's existing allowance. */
  maxWork: number;
}
