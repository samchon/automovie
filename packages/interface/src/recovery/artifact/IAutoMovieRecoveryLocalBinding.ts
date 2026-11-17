/**
 * Exact input identities and chosen ordinary open reconstruction operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Frozen generating source identity. Exact saved curve bundle byte identity.
 * @evidence contracts/development/design.md#principled-representation Exact saved curve bundle byte identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface reconstructAutoMovieRecoveryLocal share IAutoMovieRecoveryLocalBinding's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
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
