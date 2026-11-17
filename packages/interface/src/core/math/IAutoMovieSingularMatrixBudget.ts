/**
 * Explicit work and active-column accuracy limits for a small real-matrix SVD.
 *
 * @evidence contracts/development/design.md#principled-representation Separate entry, sweep and correlation limits bound the original-design Jacobi kernel without treating its numerical-null cutoff as exact rank or full relative accuracy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named numerical input exposes the limits shared by generic decomposition and its actual fitting consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A finite budget supplies neither convergence nor a rank-restoring regularization; the kernel refuses exhausted or unrepresentable work.
 * @evidence contracts/development/common.md#meaningful-documentation Members state separate matrix populations, positive complete sweeps and the admitted correlation interval.
 */
export interface IAutoMovieSingularMatrixBudget {
  /** Maximum entries in each input and square right-basis array, separately; a positive safe integer. */
  maxEntries: number;

  /** Positive safe-integer maximum complete cyclic sweeps, including the final convergence check. */
  maxSweeps: number;

  /** Relative active-column correlation threshold, from 64 machine epsilons through .01. */
  orthogonalityTolerance: number;
}
