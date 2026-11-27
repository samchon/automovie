import type { IAutoMovieRecoveryOutcome } from "..";

/** Terminated operation without a usable value. */
export interface IAutoMovieRecoveryTerminated extends IAutoMovieRecoveryOutcome {
  /**
   * Refusal declines the requested operation; failure and cancellation return
   * no usable value.
   */
  status: "refused" | "failed" | "cancelled";
}
