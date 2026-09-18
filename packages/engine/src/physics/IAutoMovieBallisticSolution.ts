import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The launch that hits a target: the initial velocity and the time of flight.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Resolves a supported analytic trajectory from authored launch constraints.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Reports the launch state of the analytic trajectory tier.
 */
export interface IAutoMovieBallisticSolution {
  /**
   * Initial velocity to give the projectile (world m/s), magnitude = speed.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Supplies the analytic launch vector that realizes the authored shot.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Carries the initial condition of the resolved trajectory.
   */
  velocity: IAutoMovieVector3;

  /**
   * Seconds until it reaches the target.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Reports when the analytic trajectory reaches its target.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Carries the solved flight duration of the trajectory.
   */
  hitTime: number;
}
