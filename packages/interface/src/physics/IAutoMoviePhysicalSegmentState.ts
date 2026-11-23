import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Observed pose and velocity of one bone origin in world coordinates.
 *
 * Inherited position is metres and rotation is a unit quaternion; velocity is
 * m/s and angularVelocity rad/s in world axes. Simulation capture writes the
 * segment record and cache/playback interpolation returns newly allocated
 * samples for display and audit. This is bone-origin velocity, not
 * automatically COM velocity or the derivative of an interpolated display path;
 * consumers must preserve that distinction.
 */
export interface IAutoMoviePhysicalSegmentState extends IAutoMovieRigidTransform {
  /**
   * World linear velocity of the bone origin in m/s, including any
   * COM-to-origin rotational contribution.
   */
  velocity: IAutoMovieVector3;

  /** World angular velocity, rad/s. */
  angularVelocity: IAutoMovieVector3;
}
