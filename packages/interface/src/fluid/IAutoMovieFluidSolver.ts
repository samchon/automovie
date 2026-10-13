/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * `validateFluidDomain` requires every number finite and refuses a step whose
 * Courant number at `referenceDepth` exceeds 1. Only the initial depths are
 * held to that design depth: a source can raise a cell past it during the
 * solve, where the checked bound no longer applies.
 *
 * @evidence contracts/common.md#principled-implementation The settings parameterize an explicit linearized shallow-water step: `gravity` drives the surface-gradient term, `drag` is applied implicitly as division by `1 + dt * drag` so it cannot overshoot, `dryDepth` gates wetting, and stability is the Courant condition at `referenceDepth`.
 * @evidence contracts/common.md#clear-and-simple-design Six scalars are everything the fixed-step solver reads; the step cap lives here because it bounds the cost of a seek through the same clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The validator refuses an unstable step rather than choosing one for the author, and the gap that a source can push depth past the checked design depth is stated instead of silently re-clamped.
 * @evidence contracts/common.md#meaningful-documentation States the finiteness and Courant refusals and the limit of the design-depth bound; members give units, ranges, how drag and dry depth act, and that seeking past `maxSteps` throws.
 * @author Samchon
 */
export interface IAutoMovieFluidSolver {
  /** Integration step in seconds; strictly positive. */
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
   * Depth in metres, `>= 0`, at or below which a cell counts as dry; a cell is
   * wet only while its depth is strictly greater. A face beside a dry cell
   * stays still unless the wet side's free surface stands above the dry side's,
   * so no water is pushed uphill onto land it cannot reach. `0` still refuses
   * flow out of an empty cell; a small positive value also suppresses
   * film-thin sloshing.
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
   * `[1, 100000]`. It bounds the work one seek can cost, so a shot cannot ask
   * for an unbounded solve; seeking past it throws.
   */
  maxSteps: number;
}
