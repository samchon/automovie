import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A projectile's first contact: seconds since launch and a world-metre contact
 * point, and, from `projectileFirstContact`, the struck surface's outward
 * normal and the collider met. It is not a unitless segment parameter.
 */
export interface IAutoMovieHit {
  /** Seconds since launch at first detected contact. */
  time: number;

  /**
   * Contact point in world metres: on the struck surface where the producer
   * reads one.
   */
  point: IAutoMovieVector3;

  /**
   * The struck surface's outward unit normal at `point`, world frame; absent
   * from a sampled sphere hit.
   */
  normal?: IAutoMovieVector3;

  /** The id of the collider met; absent from a sampled sphere hit. */
  collider?: string;
}
