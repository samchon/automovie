/**
 * Actual emitted model populations, independent of shape qualification.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Emitted render vertex population. Emitted triangle population.
 * @evidence contracts/development/design.md#principled-representation Actual emitted model populations, independent of shape qualification.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryArtifactInput, IAutoMovieRecoveryLocalResult, IAutoMovieRecoveryMeshCounts share IAutoMovieRecoveryModelCounts's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryModelCounts {
 
 /** Emitted render vertex population. */
  vertices: number;

 
 /** Emitted triangle population. */
  triangles: number;
}
