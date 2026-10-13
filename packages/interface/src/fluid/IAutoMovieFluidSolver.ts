/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * `validateFluidDomain` refuses a step whose Courant number at `referenceDepth`
 * exceeds 1. Only the initial depths are held to that design depth: a source
 * can raise a cell past it during the solve, where the checked bound no longer
 * applies.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fixed-step integration with backward-Euler drag, `(u - dt * g * dη/dx) / (1 + dt * drag)`, whose stability is checked once by the Courant number at `referenceDepth`; a source filling a cell past that depth can leave the checked bound mid-solve, an unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design Six scalars the integrator and validator read directly, with no adaptive-step or scheme option, because a fixed step is what makes a state a function of `(domain, step)`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No gravity or step value is special-cased; `9.81` appears only as an example, and an unstable step is refused by validation instead of being silently shortened.
 * @evidence contracts/common.md#meaningful-documentation States the unit and bound of every field, how drag enters the update, what wet means, that `referenceDepth` drives the Courant check and caps only initial depth, and that `maxSteps` bounds a seek.
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
