import { IAutoMovieSpringCollider } from "./IAutoMovieSpringCollider";
import { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/**
 * The cross-frame inputs that let {@link resolveFrame} step spring drivers
 * inside the frame pass: the previous-step state, the timestep, and optional
 * node-attached collision spheres. Springs are the one stateful driver: with
 * this the engine advances them deterministically frame-to-frame; without it
 * they defer exactly as before.
 *
 * @author Samchon
 */
export interface IAutoMovieResolveSprings {
  /** Cross-frame Verlet state, advanced in place. */
  state: IAutoMovieSpringState;
  /** Seconds since the previously resolved frame. Strictly positive. */
  dt: number;
  /** Collision spheres riding scene nodes. Omit for none. */
  colliders?: IAutoMovieSpringCollider[];
}
