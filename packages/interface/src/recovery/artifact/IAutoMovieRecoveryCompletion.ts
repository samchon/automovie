/** Independent generating-attempt, processing and retained-domain observations. */

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
