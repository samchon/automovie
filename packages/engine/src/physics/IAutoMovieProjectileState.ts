import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Position + velocity of a projectile at one instant.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Carries the complete analytic state at an absolute time.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Exposes the sampled state of the supported trajectory tier.
 */
export interface IAutoMovieProjectileState {
  /**
   * Projectile position in world meters.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Reports the analytic world position at the requested time.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Carries the sampled trajectory position.
   */
  position: IAutoMovieVector3;
  /**
   * Projectile velocity in world meters per second.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Reports the analytic flight direction and speed at the requested time.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Carries the sampled trajectory velocity.
   */
  velocity: IAutoMovieVector3;
}
