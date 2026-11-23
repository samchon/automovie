import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieLaunchAction } from "../harness/IAutoMovieLaunchAction";

/**
 * One gated `launch` action, ready for its flight to be solved.
 *
 * `gatePerformShotActions` records one only when the projectile is a staged
 * node and the aim resolved to a point; `compilePerformShotLaunches` then
 * solves the flight, bakes it onto the shot clock, and schedules the target's
 * recoil.
 */
export interface IAutoMoviePerformShotLaunchJob {
  /** The `launch` action, the same object as in the action list. */
  action: IAutoMovieLaunchAction;

  /** Position of the action in the performing action list. */
  index: number;

  /** The projectile's staged world position in metres, where it is released. */
  origin: IAutoMovieVector3;

  /** The aim's world point in metres at the shot's opening. */
  target: IAutoMovieVector3;

  /**
   * The node a `node` or `bone` aim strikes, or null for a point or group aim,
   * which flies but recoils no one.
   */
  targetNode: string | null;
}
