import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The angle about an axis through a contact's footprint as a join curve's
 * parameter: the curve's point at angle `t` lies in the half plane through the
 * axis at that angle from the reference.
 *
 * Engine admission: `normal` not zero and `reference` not along it.
 */
export interface IAutoMovieConstructionAngleParameter {
  /** Discriminator. */
  type: "angle";

  /** The footprint's centre, metres in the construction's frame. */
  centre: IAutoMovieVector3;

  /**
   * The axis's direction, the host's outward normal at the centre; any length
   * but zero.
   */
  normal: IAutoMovieVector3;

  /** The direction of angle 0; its part along `normal` is removed. */
  reference: IAutoMovieVector3;
}
