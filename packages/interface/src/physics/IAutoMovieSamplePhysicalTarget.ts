import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Interpolated world target poses and velocities derived from the same endpoint
 * interval.
 */
export namespace IAutoMovieSamplePhysicalTarget {
  /**
   * An interpolated authored goal and world velocity derived from its two
   * endpoint poses.
   *
   * Pose uses world metres and a unit quaternion; velocity is m/s and
   * angularVelocity rad/s from the same shortest-arc rotation over the supplied
   * interval rate. samplePhysicalTarget allocates the pose and velocity vectors
   * without changing either endpoint or advancing a physical solver. The caller
   * supplies admitted finite poses, interpolation fraction and rate; this
   * helper does not validate the clock. These are target velocities, not
   * solved-body observations.
   */
  export type IResult = {
    /**
     * Requested world bone-origin pose at the interpolation fraction, with
     * position in metres.
     */
    pose: IAutoMovieRigidTransform;

    /** Constant world endpoint-position difference times interval rate, m/s. */
    velocity: IAutoMovieVector3;

    /**
     * World shortest-arc rotation vector between endpoint rotations times
     * interval rate, rad/s.
     */
    angularVelocity: IAutoMovieVector3;
  };
}
