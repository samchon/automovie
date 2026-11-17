/**
 * Pre-integration diagnostics returned when configuring bounded native joint motors.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pre-integration angular tracking diagnostics from configuring one joint motor.
 * @evidence contracts/development/design.md#principled-representation error is a shortest-arc angular error norm in radians; saturated identifies requested torque coordinates above their configured caps.
 * @evidence contracts/development/design.md#minimal-and-owned-surface configurePhysicalJointMotor returns the command's newly allocated diagnostic array after writing the native motor settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These values describe the PD request, not observed motor impulse or successful tracking; native f32 admission can throw before a result exists.
 */
export namespace IAutoMovieConfigurePhysicalJointMotor {
  /**
   * Pre-integration angular tracking diagnostics from configuring one joint motor.
   *
   * error is a shortest-arc angular error norm in radians; saturated identifies requested torque coordinates above their configured caps. configurePhysicalJointMotor returns the command's newly allocated diagnostic array after writing the native motor settings. These values describe the PD request, not observed motor impulse or successful tracking; native f32 admission can throw before a result exists.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Pre-integration angular tracking diagnostics from configuring one joint motor.
   * @evidence contracts/development/design.md#principled-representation error is a shortest-arc angular error norm in radians; saturated identifies requested torque coordinates above their configured caps.
   * @evidence contracts/development/design.md#minimal-and-owned-surface configurePhysicalJointMotor returns the command's newly allocated diagnostic array after writing the native motor settings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These values describe the PD request, not observed motor impulse or successful tracking; native f32 admission can throw before a result exists.
   */
  export type IResult = {
    /** Shortest-arc quaternion tracking error norm, radians, before integration. */
    error: number;

    /** Joint-frame axes whose requested PD torque exceeded the strength-scaled cap; empty means no requested coordinate saturated. */
    saturated: ("x" | "y" | "z")[];
  };
}
