/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * `validateFluidDomain` refuses a step whose Courant number at `referenceDepth`
 * exceeds 1. Only the initial depths are held to that design depth: a source
 * can raise a cell past it during the solve, where the checked bound no longer
 * applies.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidSolver {
  /** Integration step in seconds; finite and strictly positive. */
  fixedStepSeconds: number;

  /** Gravity magnitude in m/s²; strictly positive (Earth is `9.81`). */
  gravity: number;

  /**
   * Linear drag in 1/s, `>= 0`, applied implicitly to face velocity: each
   * update divides by `1 + dt * drag`, which is how a shallow basin loses
   * momentum to its floor. `0` is frictionless.
   */
  drag: number;

  /**
   * Depth in metres, `>= 0`, at or below which a cell counts as dry (a cell is
   * wet only while its depth is strictly greater), so no water is pushed uphill
   * onto land it cannot reach. `0` still refuses flow out of an empty cell; a
   * small positive value also suppresses film-thin sloshing.
   */
  dryDepth: number;

  /**
   * The deepest water this domain is designed for, in metres, strictly
   * positive. It is the depth the Courant condition is checked against, and no
   * initial depth may exceed it.
   */
  referenceDepth: number;

  /**
   * Highest absolute step index a sample may integrate to, a safe integer in
   * `[1, 100000]`. It bounds the work one seek can cost, so a shot cannot
   * silently ask for an unbounded solve; seeking past it throws.
   */
  maxSteps: number;
}
