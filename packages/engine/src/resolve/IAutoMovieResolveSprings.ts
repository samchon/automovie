import { IAutoMovieSpringCollider } from "./IAutoMovieSpringCollider";
import { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/**
 * Explicit caller-owned spring history, seconds timestep and optional attached collision spheres. State advances in place when supplied and springs defer when absent.
 *
 * @evidence contracts/common.md#principled-implementation Make stateful Verlet stepping explicit through caller-owned state, a positive seconds timestep and optional node-attached collision spheres.
 * @evidence contracts/common.md#clear-and-simple-design A separate optional frame input distinguishes advancing springs from deferring them without creating a hidden resolver-global clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing colliders means an empty collision population; dt and sphere admission remain numerical guards in the actual spring/world owner.
 * @evidence contracts/common.md#meaningful-documentation Members state in-place state effects, strictly positive seconds and node-attached sphere meaning; failure can occur after earlier drivers have advanced.
 * @evidence contracts/performance.md#efficient-algorithms The wrapper has constant references; stepping cost grows with spring joints, descendants and collider tests, while state grows with visited joints/chains.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers thread the same state across equivalent scene frames; replacing a scene or driver population requires their explicit reset decision.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The scene caller owns and discards state/collider records; no timer, physics worker or host collision object is acquired.
 */
export interface IAutoMovieResolveSprings {
  /** Cross-frame Verlet state, advanced in place. */
  state: IAutoMovieSpringState;

  /** Seconds since the previously resolved frame. Strictly positive. */
  dt: number;

  /** Collision spheres riding scene nodes. Omit for none. */
  colliders?: IAutoMovieSpringCollider[];
}
