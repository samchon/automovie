/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * validateFluidDomain checks finite authored scalars and rejects a computed Courant number above one at referenceDepth. Its direct intermediate products can produce NaN for extreme finite inputs, which that comparison does not reject. Initial depths are bounded by referenceDepth, while inflow can raise solved depths beyond it without a new Courant check.
 *
 * @evidence contracts/common.md#principled-implementation Gravity drives the linearized surface-gradient step, drag divides velocity by 1 + dt * drag and dryDepth controls wetting. The analytic gravity-wave Courant condition uses referenceDepth; finite representable derived arithmetic and depth within that design premise are required for its stability interpretation, and current validation does not prove them for every admitted record.
 * @evidence contracts/common.md#clear-and-simple-design Six scalars are everything the fixed-step solver reads; the step cap lives here because it bounds the cost of a seek through the same clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No step is chosen for the author and inflow is not silently clamped to design depth. A derived NaN Courant value can escape the greater-than-one comparison, and sources can exceed the depth used by the one-time bound; these unresolved limits are not a stable-solve guarantee.
 * @evidence contracts/common.md#meaningful-documentation States scalar admission, the computed comparison and NaN gap, reference-depth limitation, units, wet/dry and drag rules, and the absolute seek budget.
 * @author Samchon
 */
export interface IAutoMovieFluidSolver {
  /** Integration step in seconds; strictly positive. */
  fixedStepSeconds: number;

  /** Gravity magnitude in m/s²; strictly positive (Earth is `9.81`). */
  gravity: number;

  /**
   * Linear drag in inverse seconds, nonnegative, dividing updated face velocity by 1 + dt * drag. Zero disables this drag term.
   */
  drag: number;

  /**
   * Nonnegative depth threshold in metres; a cell is wet only above it. A face beside dry ground remains still unless the wet free surface stands above that ground. Zero still prevents flow from empty cells, while positive thresholds suppress thinner wet films.
   */
  dryDepth: number;

  /**
   * Strictly positive design depth in metres, used for the Courant comparison and as the upper bound on initial depth. Solved inflow is not capped to it.
   */
  referenceDepth: number;

  /**
   * Highest absolute step index, a safe integer within [1, 100000], bounding one replay's iteration count. Seeking beyond it throws.
   */
  maxSteps: number;
}
