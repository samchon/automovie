/**
 * Caller-owned plain recovery metadata with explicitly unknown additional values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation 
 * @evidence contracts/development/design.md#principled-representation Caller-owned plain recovery metadata with explicitly unknown additional values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryArtifact, IAutoMovieRecoveryArtifactCoverage, IAutoMovieRecoveryMeshFrontier share IAutoMovieRecoveryMetadata's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryMetadata {
 
 /** Caller-owned plain metadata retained without inferred fields. */
  [key: string]: unknown;
}
