import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A straight axis: the section plane at station 0, moved along its normal `v x
 * u` by the station.
 *
 * Engine admission: `u` and `v` unit and square to each other.
 */
export interface IAutoMovieConstructionStraightAxis {
  /** Discriminator. */
  type: "straight";

  /** The axis point at station 0, metres in the construction's frame. */
  origin: IAutoMovieVector3;

  /** The chart's first axis, the direction of a section's polar angle 0, unit. */
  u: IAutoMovieVector3;

  /**
   * The chart's second axis, the direction of polar angle `pi / 2`, unit and
   * square to `u`.
   */
  v: IAutoMovieVector3;
}
