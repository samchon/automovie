import type {
  IAutoMovieRecoveryAnalyticDomainsInput,
  IAutoMovieRecoveryTensorFamily,
} from "..";

/**
 * Full Bernstein reconstruction input, retaining analytic domains and optional
 * ordinary tensor families. Each owner can report partial realization without
 * substituting source geometry.
 */

export interface IAutoMovieRecoveryTensorFamiliesInput extends IAutoMovieRecoveryAnalyticDomainsInput {
  /**
   * Optional tensor owners; absence retains the existing curve-only and
   * analytic-domain paths.
   */
  tensorFamilies?: readonly IAutoMovieRecoveryTensorFamily[];
}
