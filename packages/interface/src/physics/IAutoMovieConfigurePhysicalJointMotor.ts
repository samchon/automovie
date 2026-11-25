/** Pre-integration diagnostics returned when configuring bounded joint motors. */
export namespace IAutoMovieConfigurePhysicalJointMotor {
  /**
   * Pre-integration angular tracking diagnostics from configuring one joint
   * motor.
   *
   * Error is a shortest-arc angular error norm in radians; saturated identifies
   * requested torque coordinates above their configured caps.
   * configurePhysicalJointMotor returns the command's newly allocated
   * diagnostic array after writing the joint's motor settings. These values
   * describe the PD request, not observed motor impulse or successful tracking;
   * a non-finite command throws before a result exists.
   */
  export type IResult = {
    /** Shortest-arc quaternion tracking error norm, radians, before integration. */
    error: number;

    /**
     * Joint-frame axes whose requested PD torque exceeded the strength-scaled
     * cap; empty means no requested coordinate saturated.
     */
    saturated: ("x" | "y" | "z")[];
  };
}
