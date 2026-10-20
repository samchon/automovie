import type { IAutoMovieRecoveryOutcome } from "./IAutoMovieRecoveryOutcome";

/**
 * Terminated operation without a usable value.
 *
 * @evidence contracts/common.md#principled-implementation Refused, failed and cancelled terminal states explain why the operation returned no usable value.
 * @evidence contracts/common.md#clear-and-simple-design The terminal status shares operator identity and diagnostics with value-carrying outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A terminated outcome cannot supply an invented value or turn cancellation into successful completion.
 * @evidence contracts/common.md#meaningful-documentation States the absence of usable output and the meaning of each terminating state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased contract performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data belong to the caller and acquire no resources.
 */
export interface IAutoMovieRecoveryTerminated extends IAutoMovieRecoveryOutcome {
  /** Refusal declines the requested operation; failure and cancellation return no usable value. */
  status: "refused" | "failed" | "cancelled";
}
