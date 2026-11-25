import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A solved launch velocity in world metres/second and strictly positive flight
 * time in seconds for the caller's constant acceleration and speed. Null
 * refusal belongs to launch solvers, not this successful result record.
 */
export interface IAutoMovieBallisticSolution {
  /**
   * Initial world velocity in metres/second; its magnitude is the requested
   * launch speed within solver precision.
   */
  velocity: IAutoMovieVector3;

  /** Strictly positive launch-relative seconds until the solved target contact. */
  hitTime: number;
}
