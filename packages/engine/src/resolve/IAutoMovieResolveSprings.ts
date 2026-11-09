import { IAutoMovieSpringCollider } from "./IAutoMovieSpringCollider";
import { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/**
 * Explicit caller-owned spring history, seconds timestep and optional attached collision spheres. State advances in place when supplied and springs defer when absent.
 *
 * @evidence contracts/development/design.md#principled-representation Make stateful Verlet stepping explicit through caller-owned state, a positive seconds timestep and optional node-attached collision spheres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A separate optional frame input distinguishes advancing springs from deferring them without creating a hidden resolver-global clock.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing colliders means an empty collision population; dt and sphere admission remain numerical guards in the actual spring/world owner.
 * @evidence contracts/development/common.md#meaningful-documentation Members state in-place state effects, strictly positive seconds and node-attached sphere meaning; failure can occur after earlier drivers have advanced.
 */
export interface IAutoMovieResolveSprings {
  /** Cross-frame Verlet state, advanced in place. */
  state: IAutoMovieSpringState;

  /** Seconds since the previously resolved frame. Strictly positive. */
  dt: number;

  /** Collision spheres riding scene nodes. Omit for none. */
  colliders?: IAutoMovieSpringCollider[];
}
