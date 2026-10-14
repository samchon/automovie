import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSoftStiffness } from "./IAutoMovieSoftStiffness";

/**
 * Fixed-step integration settings and declared seek budgets.
 *
 * @evidence contracts/common.md#principled-implementation The CPU solver predicts velocity with implicit linear drag, applies the selected number of Jacobi stiffness sweeps and integrates only integer absolute steps; validation checks finite values and the authored travel number.
 * @evidence contracts/common.md#clear-and-simple-design Numerical settings and bounded seek work live beside the domain instead of being inferred from playback frame rate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts referenceSpeed is an author-supplied design speed used in admission, not a runtime speed clamp or a continuous collision certificate; maxSpeed reports the resulting solve separately.
 * @evidence contracts/common.md#meaningful-documentation Members give seconds, acceleration, inverse-second drag, dimensionless stiffness, iteration count and the maximum absolute integration step.
 * @author Samchon
 */
export interface IAutoMovieSoftSolver {
  /** Integration step in seconds; strictly positive. */
  fixedStepSeconds: number;

  /**
   * Uniform body acceleration in m/s², normally `{ x: 0, y: -9.81, z: 0 }`. A vector rather than a magnitude so a panel can be solved in a tilted frame without rewriting its rest mesh.
   */
  gravity: IAutoMovieVector3;

  /**
   * Linear velocity damping in 1/s, applied implicitly as `v / (1 + dt·drag)`, which is how cloth loses energy to the air around it. `0` is undamped.
   */
  drag: number;

  /**
   * Constraint relaxation sweeps per step; an integer of at least 1. Each sweep repeats the simultaneous weighted distance correction at linear cost; a larger count does not establish monotonic strain reduction or exact inextensibility.
   */
  iterations: number;

  /** How hard each constraint family pulls, each in `[0, 1]`. */
  stiffness: IAutoMovieSoftStiffness;

  /**
   * Declared design speed in m/s, strictly positive, used in the travel estimate `dt * referenceSpeed / shortestStructuralRestLength`. The solver does not clamp observed speed to this value, and lattice spacing does not establish that a discrete step cannot tunnel through a thinner collider.
   */
  referenceSpeed: number;

  /**
   * Highest absolute step index a sample may integrate to. It bounds the work one seek can cost, so a shot cannot silently ask for an unbounded solve.
   */
  maxSteps: number;
}
