/**
 * Explicit work and active-column accuracy limits for a small real-matrix SVD.
 *
 * @evidence contracts/common.md#principled-implementation Separate entry, sweep and correlation limits bound the original-design Jacobi kernel without treating its numerical-null cutoff as exact rank or full relative accuracy.
 * @evidence contracts/common.md#clear-and-simple-design One named numerical input exposes the limits shared by generic decomposition and its actual fitting consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A finite budget supplies neither convergence nor a rank-restoring regularization; the kernel refuses exhausted or unrepresentable work.
 * @evidence contracts/common.md#meaningful-documentation Members state separate matrix populations, positive complete sweeps and the admitted correlation interval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased input performs no decomposition; the numerical kernel owns its work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration coordinates no cache or shared operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar limits acquire no handle or running task.
 */
export interface IAutoMovieSingularMatrixBudget {
  /** Maximum entries in each input and square right-basis array, separately; a positive safe integer. */
  maxEntries: number;

  /** Positive safe-integer maximum complete cyclic sweeps, including the final convergence check. */
  maxSweeps: number;

  /** Relative active-column correlation threshold, from 64 machine epsilons through .01. */
  orthogonalityTolerance: number;
}
