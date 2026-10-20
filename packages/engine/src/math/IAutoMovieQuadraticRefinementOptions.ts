/**
 * The admission threshold and work budget of
 * `refineAutoMovieQuadraticProgram`.
 *
 * The threshold is compared, unchanged, with the largest original row
 * violation, the stationarity residual and the complementarity residual, each
 * in the caller's row and objective units. Meeting it is numerical convergence
 * only; the caller still checks the geometry the variables describe.
 *
 * @evidence contracts/common.md#principled-implementation One absolute threshold applied to the three KKT residuals of the original program, the standard admission for a numerical QP solution, plus a finite step count so polishing always terminates.
 * @evidence contracts/common.md#clear-and-simple-design The two knobs the refinement reads, with no per-method or per-residual variant, so one budget covers both polishing methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The refinement never loosens the threshold or extends the budget for a hard problem.
 * @evidence contracts/common.md#meaningful-documentation States which residuals the threshold bounds and in which units, that passing is not a geometric guarantee, and each field's valid range and the meaning of a zero budget.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An options record with no algorithm; the budget's effect is answered on `polishAutoMovieQuadraticProgram`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A per-call input that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers read by the refinement; nothing is retained.
 */
export interface IAutoMovieQuadraticRefinementOptions {
  /** Admission threshold for every residual; positive and finite. */
  tolerance: number;

  /**
   * Polishing steps allowed, dual sweeps or working solves; a non-negative
   * safe integer, where 0 returns the native solution unpolished.
   */
  maximumRefinements: number;
}
