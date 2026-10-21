/**
 * Optional original-design working-space and arc limits.
 *
 * @evidence contracts/common.md#principled-implementation A full untilted convex-QP certificate may accelerate an already qualified tilted direction; it cannot supply nonlinear stationarity or data rank.
 * @evidence contracts/common.md#clear-and-simple-design The owner supplies its existing singular, entry and resident limits; no new outer trial allowance is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported working spaces retain the original direction, never a successful initial-state fallback or a relaxed observation.
 * @evidence contracts/common.md#meaningful-documentation Members separate existing factor limits, owner retention and per-model conservative work.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased scalar input performs no numerical operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ceilings acquire no external resource.
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
