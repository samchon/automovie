import type { IAutoMovieRecoveryAnalyticDomainsInput } from "./IAutoMovieRecoveryAnalyticDomainsInput";
import type { IAutoMovieRecoveryTensorFamily } from "./IAutoMovieRecoveryTensorFamily";

/**
 * Analytic recipes with the optional tensor ownership claims checked for conflicts.
 *
 * @evidence contracts/common.md#principled-implementation Only the original replacedGroups claims are required from optional tensor families.
 * @evidence contracts/common.md#clear-and-simple-design This input preserves the existing partial tensor ownership projection without requiring unrelated tensor geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No new admission, defaults or fallback geometry is introduced.
 * @evidence contracts/common.md#meaningful-documentation Optional tensor claims retain their saved interval and group addresses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No runtime cache is owned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input records remain caller-owned.
 */
export interface IAutoMovieRecoveryAnalyticRealizationInput extends IAutoMovieRecoveryAnalyticDomainsInput {
  /** Optional ownership claims used to reject duplicate analytic generation. */
  tensorFamilies?: readonly Pick<
    IAutoMovieRecoveryTensorFamily,
    "replacedGroups"
  >[];
}
