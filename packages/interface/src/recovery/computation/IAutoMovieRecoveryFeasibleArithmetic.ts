/**
 * Forward-error bounds for an exactly normalized version of stored dual
 * weights.
 */
export interface IAutoMovieRecoveryFeasibleArithmetic {
  /**
   * Infinity-norm error to the exact aggregate of the exactly normalized stored
   * weights.
   */
  aggregate: number;

  /** Absolute difference bound for the minimum authored row price. */
  minimumPrice: number;

  /** Absolute discrepancy bound between computed and exact normalized-dual gaps. */
  gap: number;
}
