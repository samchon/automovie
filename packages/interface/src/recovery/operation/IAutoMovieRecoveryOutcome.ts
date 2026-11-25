import type { AutoMovieRecoveryOperator } from "../../index";

/** Common operation identity and diagnostics. */
export interface IAutoMovieRecoveryOutcome {
  /** Actual operation identity, without a visual quality assertion. */
  operator: AutoMovieRecoveryOperator;

  /** Operation limitations and reasons, including unknown coverage. */
  diagnostics: string[];
}
