import type { IAutoMovieRecoveryCompletion, IAutoMovieRecoveryMetadata } from "../../index";

/**
 * Published coverage observations and caller-owned additional qualification fields.
 *
 * @evidence contracts/development/common.md#meaningful-documentation 
 * @evidence contracts/development/design.md#principled-representation Published coverage observations and caller-owned additional qualification fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryArtifact share IAutoMovieRecoveryArtifactCoverage's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryArtifactCoverage
  extends IAutoMovieRecoveryCompletion, IAutoMovieRecoveryMetadata {}
