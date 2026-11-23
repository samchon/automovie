/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * ValidateFluidDomain checks finite authored scalars and rejects a computed
 * Courant number above one at referenceDepth. Its direct intermediate products
 * can produce NaN for extreme finite inputs, which that comparison does not
 * reject. Initial depths are bounded by referenceDepth, while inflow can raise
 * solved depths beyond it without a new Courant check.
 */
export interface IAutoMovieFluidSolver {
  /** Integration step in seconds; strictly positive. */
  fixedStepSeconds: number;

  /**
   * Gravity magnitude in m/s²; strictly positive (standard gravity is
   * `9.80665`).
   */
  gravity: number;

  /**
   * Linear drag in inverse seconds, nonnegative, dividing updated face velocity
   * by 1 + dt * drag. Zero disables this drag term.
   */
  drag: number;

  /**
   * Nonnegative depth threshold in metres; a cell is wet only above it. A face
   * beside dry ground remains still unless the wet free surface stands above
   * that ground. Zero still prevents flow from empty cells, while positive
   * thresholds suppress thinner wet films.
   */
  dryDepth: number;

  /**
   * Strictly positive design depth in metres, used for the Courant comparison
   * and as the upper bound on initial depth. Solved inflow is not capped to
   * it.
   */
  referenceDepth: number;

  /**
   * Highest absolute step index, a safe integer within [1, 100000], bounding
   * one replay's iteration count. Seeking beyond it throws.
   */
  maxSteps: number;
}
