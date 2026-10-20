/**
 * Exact input identities and chosen ordinary open reconstruction operation.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/common.md#clear-and-simple-design One independently named record is shared by its producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its runtime owner controls publication and computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and the type acquires no resource handle.
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
