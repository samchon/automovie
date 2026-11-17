import type {
  IAutoMovieRecoveryAnalyticDomainsInput,
  IAutoMovieRecoveryTensorFamily,
} from "../../index";

/**
 * Full Bernstein reconstruction input, retaining analytic domains and optional ordinary tensor families. Each owner can report partial realization without substituting source geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Optional tensor owners; absence retains the existing curve-only and analytic-domain paths.
 * @evidence contracts/development/design.md#principled-representation Optional tensor owners; absence retains the existing curve-only and analytic-domain paths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface applyAutoMovieRecoveryAnalyticPublication, realizeAutoMovieRecoveryTensorFamilies, reconstructAutoMovieRecoveryModel share IAutoMovieRecoveryTensorFamiliesInput's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional tensor owners; absence retains the existing curve-only and analytic-domain paths.
 */

export interface IAutoMovieRecoveryTensorFamiliesInput extends IAutoMovieRecoveryAnalyticDomainsInput {
  /** Optional tensor owners; absence retains the existing curve-only and analytic-domain paths. */
  tensorFamilies?: readonly IAutoMovieRecoveryTensorFamily[];
}
