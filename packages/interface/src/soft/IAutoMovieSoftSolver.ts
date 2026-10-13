import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSoftStiffness } from "./IAutoMovieSoftStiffness";

/** Fixed-step integration settings and the budgets validation enforces. */
export interface IAutoMovieSoftSolver {
  /** Integration step in seconds; strictly positive. */
  fixedStepSeconds: number;

  /**
   * Uniform body acceleration in m/s², normally `{ x: 0, y: -9.81, z: 0 }`. A
   * vector rather than a magnitude so a panel can be solved in a tilted frame
   * without rewriting its rest mesh.
   */
  gravity: IAutoMovieVector3;

  /**
   * Linear velocity damping in 1/s, applied implicitly as `v / (1 + dt·drag)`,
   * which is how cloth loses energy to the air around it. `0` is undamped.
   */
  drag: number;

  /**
   * Constraint relaxation sweeps per step; an integer of at least 1. More
   * sweeps make the panel less stretchy at a linear cost, which is the honest
   * trade a position-based solver offers instead of a spring constant.
   */
  iterations: number;

  /** How hard each constraint family pulls, each in `[0, 1]`. */
  stiffness: IAutoMovieSoftStiffness;

  /**
   * The fastest particle motion this panel is designed for, in m/s, strictly
   * positive. It is the speed the travel condition is checked against: a step
   * that could displace a particle further than the shortest constraint would
   * tunnel through a collider and project a constraint the wrong way.
   */
  referenceSpeed: number;

  /**
   * Highest absolute step index a sample may integrate to. It bounds the work
   * one seek can cost, so a shot cannot silently ask for an unbounded solve.
   */
  maxSteps: number;
}
