/**
 * Independent generating-attempt, processing and retained-domain observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Whether the generating attempt reached its terminal point. Whether all declared processing completed.
 * @evidence contracts/development/design.md#principled-representation Independent generating-attempt, processing and retained-domain observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryArtifactCoverage, IAutoMovieRecoveryLocalResult share IAutoMovieRecoveryCompletion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual retained triangle population.
 */

export interface IAutoMovieRecoveryCompletion {
 
 /** Whether the generating attempt reached its terminal point. */
  attemptComplete: boolean;

 
 /** Whether all declared processing completed. */
  processingComplete: boolean;

 
 /** Whether every admitted retained domain was generated. */
  retainedDomainComplete: boolean;

 
 /** Actual retained triangle population. */
  generatedTriangles: number;
}
