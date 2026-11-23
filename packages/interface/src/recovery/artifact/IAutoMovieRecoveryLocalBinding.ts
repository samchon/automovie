/** Exact input identities and chosen ordinary open reconstruction operation. */

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
