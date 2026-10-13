import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A ballistic **projectile** launch: an origin, an initial velocity, and a
 * constant acceleration (gravity). This is the minimal state needed to fly an
 * arrow, a thrown spear, or any free body: the first taste of _simulation_
 * (state evolving under physical law) rather than authored keyframes.
 *
 * @author Samchon
 */
export interface IAutoMovieProjectile {
  /** Launch position (world meters). */
  origin: IAutoMovieVector3;
  /** Initial velocity (world meters/second). */
  velocity: IAutoMovieVector3;
  /** Constant acceleration, e.g. gravity `{ x: 0, y: -9.81, z: 0 }`. */
  gravity: IAutoMovieVector3;
}
