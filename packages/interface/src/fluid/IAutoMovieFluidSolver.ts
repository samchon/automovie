/** Fixed-step integration settings and the budgets validation enforces. */
export interface IAutoMovieFluidSolver {
  /** Integration step in seconds; strictly positive. */
  fixedStepSeconds: number;

  /** Gravity magnitude in m/s²; strictly positive (Earth is `9.81`). */
  gravity: number;

  /**
   * Linear drag in 1/s applied implicitly to face velocity, which is how a
   * shallow basin loses momentum to its floor. `0` is frictionless.
   */
  drag: number;

  /**
   * Depth in metres at or below which a cell counts as dry, so no water is
   * pushed uphill onto land it cannot reach. `0` still refuses flow out of an
   * empty cell; a small positive value also suppresses film-thin sloshing.
   */
  dryDepth: number;

  /**
   * The deepest water this domain is designed for, in metres, strictly
   * positive. It is the depth the Courant condition is checked against, and no
   * initial depth may exceed it.
   */
  referenceDepth: number;

  /**
   * Highest absolute step index a sample may integrate to. It bounds the work
   * one seek can cost, so a shot cannot silently ask for an unbounded solve.
   */
  maxSteps: number;
}
