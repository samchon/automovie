import type { IAutoMovieRecoveryOutcome } from "./IAutoMovieRecoveryOutcome";

/**
 * A finished operation with usable caller-owned output, including partial coverage.
 * Neither complete coverage nor a returned value certifies visual fidelity.
 *
 * @evidence contracts/development/design.md#principled-representation The complete or partial status accompanies an actual returned value and the producing operator's diagnostics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The caller receives the same value-bearing shape for a completed scope and retained partial output.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A returned value does not imply full source coverage, visual fidelity or watertightness.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes declared processing completion from partial output and caller ownership of the value.
 */
export interface IAutoMovieRecoveryCompleted<
  T,
> extends IAutoMovieRecoveryOutcome {
  /** Complete qualifies declared coverage only; partial retains usable output. */
  status: "complete" | "partial";

  /** Caller-owned output without a visual quality certificate. */
  value: T;
}
