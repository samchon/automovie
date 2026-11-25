/** Explicit work and active-column accuracy limits for a small real-matrix SVD. */
export interface IAutoMovieSingularMatrixBudget {
  /**
   * Maximum entries in each input and square right-basis array, separately; a
   * positive safe integer.
   */
  maxEntries: number;

  /**
   * Positive safe-integer maximum complete cyclic sweeps, including the final
   * convergence check.
   */
  maxSweeps: number;

  /**
   * Relative active-column correlation threshold, from 64 machine epsilons
   * through .01.
   */
  orthogonalityTolerance: number;
}
