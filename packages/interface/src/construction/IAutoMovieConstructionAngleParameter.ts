import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Parameterize an intersection trace by angle about the supplied contact axis.
 * The centre is in construction-frame metres. Project the reference into the
 * plane perpendicular to the normal to define zero radians. Supply a nonzero
 * normal and a reference with a nonzero projection.
 */
export interface IAutoMovieConstructionAngleParameter {
  /** Select the angle parameter of a construction trace. */
  type: "angle";

  /**
   * Axis origin in construction-frame metres, usually the centre of the contact
   * footprint.
   */
  centre: IAutoMovieVector3;

  /**
   * Dimensionless axis direction in the construction frame. Use a nonzero
   * vector; the trace normalizes it before reading angles.
   */
  normal: IAutoMovieVector3;

  /**
   * Dimensionless direction that becomes angle zero after removing its
   * component along the axis. Supply a nonzero projection.
   */
  reference: IAutoMovieVector3;
}
