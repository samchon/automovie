import type {
  IAutoMovieRecoveryAnalyticDomainsInput,
  IAutoMovieRecoveryTensorFamily,
} from "../../index";

/**
 * Analytic recipes with the optional tensor ownership claims checked for
 * conflicts.
 */
export interface IAutoMovieRecoveryAnalyticRealizationInput extends IAutoMovieRecoveryAnalyticDomainsInput {
  /** Optional ownership claims used to reject duplicate analytic generation. */
  tensorFamilies?: readonly Pick<
    IAutoMovieRecoveryTensorFamily,
    "replacedGroups"
  >[];
}
