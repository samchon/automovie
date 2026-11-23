import type { IAutoMovieSpringCollider } from "./IAutoMovieSpringCollider";
import type { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/**
 * Explicit caller-owned spring history, seconds timestep and optional attached
 * collision spheres. State advances in place when supplied and springs defer
 * when absent.
 */
export interface IAutoMovieResolveSprings {
  /** Cross-frame Verlet state, advanced in place. */
  state: IAutoMovieSpringState;

  /** Seconds since the previously resolved frame. Strictly positive. */
  dt: number;

  /** Collision spheres riding scene nodes. Omit for none. */
  colliders?: IAutoMovieSpringCollider[];
}
