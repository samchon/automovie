import type {
  IAutoMovieRecoveryAnalyticDomain,
  IAutoMovieRecoveryCurveOverride,
  IAutoMovieRecoveryInputHashes,
} from "../../index";

/**
 * Exact-input coefficient replacements and separately owned analytic recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original source commit identifier accepted by the existing admission policy. Atomic named coefficient replacements with independent numerical data estimates.
 * @evidence contracts/development/design.md#principled-representation Exact-input coefficient replacements and separately owned analytic recipes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface applyAutoMovieRecoveryAnalyticPublication share IAutoMovieRecoveryAnalyticPublication's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Atomic named coefficient replacements with independent numerical data estimates.
 */

export interface IAutoMovieRecoveryAnalyticPublication extends IAutoMovieRecoveryInputHashes {
  /** Original source commit identifier accepted by the existing admission policy. */
  sourceCommit: string;

  /** Atomic named coefficient replacements with independent numerical data estimates. */
  curveOverrides: readonly IAutoMovieRecoveryCurveOverride[];

  /** Source-free analytic ownership and coefficient declarations. */
  analyticDomains: readonly IAutoMovieRecoveryAnalyticDomain[];
}
