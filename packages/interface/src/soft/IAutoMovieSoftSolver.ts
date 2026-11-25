import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieSoftCompliance } from "./IAutoMovieSoftCompliance";
import type { IAutoMovieSoftStiffness } from "./IAutoMovieSoftStiffness";

/** Fixed-step integration settings and declared seek budgets. */
export interface IAutoMovieSoftSolver {
  /** Integration step in seconds; strictly positive. */
  fixedStepSeconds: number;

  /**
   * Uniform body acceleration in m/s², normally standard gravity, `{ x: 0, y:
   * -9.80665, z: 0 }`. A vector rather than a magnitude so a panel can be
   * solved in a tilted frame without rewriting its rest mesh.
   */
  gravity: IAutoMovieVector3;

  /**
   * Linear velocity damping in 1/s, applied implicitly as `v / (1 + dt·drag)`,
   * which is how cloth loses energy to the air around it. `0` is undamped.
   */
  drag: number;

  /**
   * Constraint relaxation sweeps per step; an integer of at least 1. Each sweep
   * repeats the simultaneous weighted distance correction at linear cost; a
   * larger count does not establish monotonic strain reduction or exact
   * inextensibility.
   */
  iterations: number;

  /**
   * How hard each constraint family pulls, each in `[0, 1]`: the relaxation
   * weights of the plain position-based sweeps, read only when `compliance` is
   * absent.
   */
  stiffness: IAutoMovieSoftStiffness;

  /**
   * Each constraint family's compliance, metres per newton, which switches the
   * solve to compliant constraints with a Lagrange multiplier each (XPBD),
   * projected one after another: the stiffness then does not depend on
   * `iterations` or `fixedStepSeconds`, and the force a held particle bears can
   * be read. Absent or null keeps the plain position-based solve with
   * `stiffness`, unchanged.
   */
  compliance?: IAutoMovieSoftCompliance | null;

  /**
   * Declared design speed in m/s, strictly positive, used in the travel
   * estimate `dt * referenceSpeed / shortestStructuralRestLength`. The solver
   * does not clamp observed speed to this value, and lattice spacing does not
   * establish that a discrete step cannot tunnel through a thinner collider.
   */
  referenceSpeed: number;

  /**
   * Highest absolute step index a sample may integrate to. It bounds the work
   * one seek can cost, so a shot cannot silently ask for an unbounded solve.
   */
  maxSteps: number;
}
