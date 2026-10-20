import type { IAutoMovieRecoveryOutcome } from "./IAutoMovieRecoveryOutcome";

/**
 * A finished operation with usable caller-owned output, including partial coverage.
 * Neither complete coverage nor a returned value certifies visual fidelity.
 *
 * @evidence contracts/common.md#principled-implementation The complete or partial status accompanies an actual returned value and the producing operator's diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design The caller receives the same value-bearing shape for a completed scope and retained partial output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned value does not imply full source coverage, visual fidelity or watertightness.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes declared processing completion from partial output and caller ownership of the value.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased contract performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data belong to the caller and acquire no resources.
 */
export interface IAutoMovieRecoveryCompleted<
  T,
> extends IAutoMovieRecoveryOutcome {
  /** Complete qualifies declared coverage only; partial retains usable output. */
  status: "complete" | "partial";

  /** Caller-owned output without a visual quality certificate. */
  value: T;
}
