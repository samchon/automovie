import type { IAutoMovieRecoveryAnalyticDomainsInput } from "./IAutoMovieRecoveryAnalyticDomainsInput";
import type { IAutoMovieRecoveryTensorFamily } from "./IAutoMovieRecoveryTensorFamily";

/**
 * Full Bernstein reconstruction input, retaining analytic domains and optional ordinary tensor families. Each owner can report partial realization without substituting source geometry.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 */
export interface IAutoMovieRecoveryTensorFamiliesInput extends IAutoMovieRecoveryAnalyticDomainsInput {
  /** Optional tensor owners; absence retains the existing curve-only and analytic-domain paths. */
  tensorFamilies?: readonly IAutoMovieRecoveryTensorFamily[];
}
