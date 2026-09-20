import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSoftStiffness } from "./IAutoMovieSoftStiffness";

/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `IAutoMovieSoftSolver` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftSolver` for the soft collider and solver transition system contract.
 */
export interface IAutoMovieSoftSolver {
  /**
   * Integration step in seconds; strictly positive.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `fixedStepSeconds` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `fixedStepSeconds` for the soft collider and solver transition system contract.
   */
  fixedStepSeconds: number;

  /**
   * Uniform body acceleration in m/s², normally `{ x: 0, y: -9.81, z: 0 }`. A
   * vector rather than a magnitude so a panel can be solved in a tilted frame
   * without rewriting its rest mesh.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `gravity` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `gravity` for the soft collider and solver transition system contract.
   */
  gravity: IAutoMovieVector3;

  /**
   * Linear velocity damping in 1/s, applied implicitly as `v / (1 + dt·drag)`,
   * which is how cloth loses energy to the air around it. `0` is undamped.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `drag` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `drag` for the soft collider and solver transition system contract.
   */
  drag: number;

  /**
   * Constraint relaxation sweeps per step; an integer of at least 1. More
   * sweeps make the panel less stretchy at a linear cost, which is the honest
   * trade a position-based solver offers instead of a spring constant.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `iterations` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `iterations` for the soft collider and solver transition system contract.
   */
  iterations: number;

  /**
   * How hard each constraint family pulls, each in `[0, 1]`.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `stiffness` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `stiffness` for the soft collider and solver transition system contract.
   */
  stiffness: IAutoMovieSoftStiffness;

  /**
   * The fastest particle motion this panel is designed for, in m/s, strictly
   * positive. It is the speed the travel condition is checked against: a step
   * that could displace a particle further than the shortest constraint would
   * tunnel through a collider and project a constraint the wrong way.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `referenceSpeed` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `referenceSpeed` for the soft collider and solver transition system contract.
   */
  referenceSpeed: number;

  /**
   * Highest absolute step index a sample may integrate to. It bounds the work
   * one seek can cost, so a shot cannot silently ask for an unbounded solve.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `maxSteps` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `maxSteps` for the soft collider and solver transition system contract.
   */
  maxSteps: number;
}
