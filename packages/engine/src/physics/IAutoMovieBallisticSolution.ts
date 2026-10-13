import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The launch that hits a target: the initial velocity and the time of flight.
 */
export interface IAutoMovieBallisticSolution {
  /** Initial velocity to give the projectile (world m/s), magnitude = speed. */
  velocity: IAutoMovieVector3;

  /** Seconds until it reaches the target. */
  hitTime: number;
}
