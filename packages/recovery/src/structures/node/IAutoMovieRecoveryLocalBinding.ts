/**
 * Exact input identities and chosen ordinary open reconstruction operation.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryLocalBinding {
  /** Frozen generating source identity. */
  sourceEpoch: string;

  /** Exact saved curve bundle byte identity. */
  curveBundleSha256: string;

  /** Exact saved continuation byte identity. */
  continuationSha256: string;

  /** Explicit ordinary open-course interpolation method. */
  operator: "quadratic" | "ruled";

  /** Whether to publish repeated standalone prefixes. */
  publishCheckpoints?: boolean;

  /** Optional exact analytic coefficient extension identity. */
  analyticPublicationSha256?: string;
}
