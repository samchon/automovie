import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Position + velocity of a projectile at one instant, and its rotation when the
 * projectile states an attitude.
 */
export interface IAutoMovieProjectileState {
  /** Projectile position in world meters. */
  position: IAutoMovieVector3;

  /** Projectile velocity in world meters per second. */
  velocity: IAutoMovieVector3;

  /**
   * The body's rotation, body to world, present only when the projectile states
   * an `attitude`.
   */
  rotation?: IAutoMovieQuaternion;
}
