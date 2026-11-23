import type { IAutoMovieRecoveryOutcome } from "../../index";

/**
 * A finished operation with usable caller-owned output, including partial
 * coverage. Neither complete coverage nor a returned value certifies visual
 * fidelity.
 */
export interface IAutoMovieRecoveryCompleted<
  T,
> extends IAutoMovieRecoveryOutcome {
  /** Complete qualifies declared coverage only; partial retains usable output. */
  status: "complete" | "partial";

  /** Caller-owned output without a visual quality certificate. */
  value: T;
}
