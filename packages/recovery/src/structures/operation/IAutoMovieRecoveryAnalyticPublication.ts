import type { IAutoMovieRecoveryCurveOverride } from "../curve/IAutoMovieRecoveryCurveOverride";
import type { IAutoMovieRecoveryAnalyticDomain } from "../domain/IAutoMovieRecoveryAnalyticDomain";
import type { IAutoMovieRecoveryInputHashes } from "./IAutoMovieRecoveryInputHashes";

/**
 * Exact-input coefficient replacements and separately owned analytic recipes.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/common.md#clear-and-simple-design This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned records and arrays; the type acquires no resources.
 */
export interface IAutoMovieRecoveryAnalyticPublication extends IAutoMovieRecoveryInputHashes {
  /** Original source commit identifier accepted by the existing admission policy. */
  sourceCommit: string;

  /** Atomic named coefficient replacements with independent numerical data estimates. */
  curveOverrides: readonly IAutoMovieRecoveryCurveOverride[];

  /** Source-free analytic ownership and coefficient declarations. */
  analyticDomains: readonly IAutoMovieRecoveryAnalyticDomain[];
}
