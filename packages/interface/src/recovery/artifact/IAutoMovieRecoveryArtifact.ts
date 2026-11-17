import type { IAutoMovieRecoveryArtifactCoverage, IAutoMovieRecoveryMetadata } from "../../index";

/**
 * Current generated recovery artifact with explicit coverage observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separate processing and retained-domain qualifications.
 * @evidence contracts/development/design.md#principled-representation Current generated recovery artifact with explicit coverage observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface createAutoMovieRecoveryArtifact share IAutoMovieRecoveryArtifact's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Separate processing and retained-domain qualifications.
 */

export interface IAutoMovieRecoveryArtifact extends IAutoMovieRecoveryMetadata {
 
 /** Separate processing and retained-domain qualifications. */
  coverage: IAutoMovieRecoveryArtifactCoverage;
}
