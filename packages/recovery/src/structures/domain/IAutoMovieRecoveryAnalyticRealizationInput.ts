import type { IAutoMovieRecoveryAnalyticDomainsInput } from "./IAutoMovieRecoveryAnalyticDomainsInput";
import type { IAutoMovieRecoveryTensorFamily } from "./IAutoMovieRecoveryTensorFamily";

/**
 * Analytic recipes with the optional tensor ownership claims checked for conflicts.
 *
 * @evidence contracts/development/design.md#principled-representation Only the original replacedGroups claims are required from optional tensor families.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This input preserves the existing partial tensor ownership projection without requiring unrelated tensor geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new admission, defaults or fallback geometry is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation Optional tensor claims retain their saved interval and group addresses.
 */
export interface IAutoMovieRecoveryAnalyticRealizationInput extends IAutoMovieRecoveryAnalyticDomainsInput {
  /** Optional ownership claims used to reject duplicate analytic generation. */
  tensorFamilies?: readonly Pick<
    IAutoMovieRecoveryTensorFamily,
    "replacedGroups"
  >[];
}
