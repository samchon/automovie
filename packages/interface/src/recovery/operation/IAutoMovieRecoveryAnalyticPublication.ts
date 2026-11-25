import type {
  IAutoMovieRecoveryAnalyticDomain,
  IAutoMovieRecoveryCurveOverride,
  IAutoMovieRecoveryInputHashes,
} from "../../index";

/** Exact-input coefficient replacements and separately owned analytic recipes. */

export interface IAutoMovieRecoveryAnalyticPublication extends IAutoMovieRecoveryInputHashes {
  /**
   * Original source commit identifier accepted by the existing admission
   * policy.
   */
  sourceCommit: string;

  /**
   * Atomic named coefficient replacements with independent numerical data
   * estimates.
   */
  curveOverrides: readonly IAutoMovieRecoveryCurveOverride[];

  /** Source-free analytic ownership and coefficient declarations. */
  analyticDomains: readonly IAutoMovieRecoveryAnalyticDomain[];
}
