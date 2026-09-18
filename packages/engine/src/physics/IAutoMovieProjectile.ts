import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A ballistic **projectile** launch: an origin, an initial velocity, and a
 * constant acceleration (gravity). This is the minimal state needed to fly an
 * arrow, a thrown spear, or any free body: the first taste of _simulation_
 * (state evolving under physical law) rather than authored keyframes.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Declares the initial state of a supported analytic projectile path.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Represents the inputs of the analytic trajectory tier.
 * @author Samchon
 */
export interface IAutoMovieProjectile {
  /**
   * Launch position (world meters).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Fixes the world-space origin of the analytic path.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Supplies the trajectory's initial position.
   */
  origin: IAutoMovieVector3;
  /**
   * Initial velocity (world meters/second).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Fixes the launch direction and speed of the analytic path.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Supplies the trajectory's initial velocity.
   */
  velocity: IAutoMovieVector3;
  /**
   * Constant acceleration, e.g. gravity `{ x: 0, y: -9.81, z: 0 }`.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Declares the acceleration under which the analytic path is evaluated.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Supplies the fixed acceleration of the trajectory tier.
   */
  gravity: IAutoMovieVector3;
}
