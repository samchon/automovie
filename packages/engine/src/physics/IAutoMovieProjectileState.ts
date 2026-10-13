import { IAutoMovieVector3 } from "@automovie/interface";

/** Position + velocity of a projectile at one instant. */
export interface IAutoMovieProjectileState {
  /** Projectile position in world meters. */
  position: IAutoMovieVector3;
  /** Projectile velocity in world meters per second. */
  velocity: IAutoMovieVector3;
}
