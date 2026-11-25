/**
 * World-pose-derived angular coordinates and unadjusted physical-joint limit
 * violations.
 */
export namespace IAutoMovieMeasurePhysicalJointLimits {
  /**
   * Measured native joint-coordinate angles and their unadjusted limit
   * violations.
   *
   * The mutable array contains x, y and z in that order; angles and nonnegative
   * violations are radians in the declared joint frames.
   * measurePhysicalJointLimits computes these from displayed parent and child
   * poses; the caller independently chooses acceptable numerical tolerance.
   * Free coordinates use wrapped twist projection and distance to the nearest
   * limit; omitted axes are locked and report absolute locked-coordinate error.
   * This measurement does not apply a solver tolerance.
   */
  export type IResult = {
    /**
     * Coordinate of the joint frame; all three axes are reported, including
     * locked axes.
     */
    axis: "x" | "y" | "z";

    /** Signed measured coordinate wrapped to [-pi, pi], radians. */
    angle: number;

    /**
     * Nonnegative shortest angular distance outside the declared interval,
     * radians; zero inside, absolute angle for a locked axis.
     */
    violation: number;
  }[];
}
