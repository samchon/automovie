import type { IAutoMovieRecoveryCurveOverride } from "../curve/IAutoMovieRecoveryCurveOverride";
import type { IAutoMovieRecoveryAnalyticDomain } from "../domain/IAutoMovieRecoveryAnalyticDomain";
import type { IAutoMovieRecoveryInputHashes } from "./IAutoMovieRecoveryInputHashes";

/**
 * Exact-input coefficient replacements and separately owned analytic recipes.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 */
export interface IAutoMovieRecoveryAnalyticPublication extends IAutoMovieRecoveryInputHashes {
  /** Original source commit identifier accepted by the existing admission policy. */
  sourceCommit: string;

  /** Atomic named coefficient replacements with independent numerical data estimates. */
  curveOverrides: readonly IAutoMovieRecoveryCurveOverride[];

  /** Source-free analytic ownership and coefficient declarations. */
  analyticDomains: readonly IAutoMovieRecoveryAnalyticDomain[];
}
