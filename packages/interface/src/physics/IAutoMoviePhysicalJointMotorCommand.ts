import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";

/**
 * One joint's motor command. One axis's native velocity-motor command.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes bounded motor commands, geodesic error and pre-solve saturation forecasts. States the axis, target speed, implicit damping and torque cap of one native motor.
 * @evidence contracts/development/design.md#principled-representation axes retain declaration order; error is radians and saturated identifies joint-frame torque demands above their caps. The axis literal selects a joint-frame coordinate; speed is rad/s, damping N m s/rad and maximumTorque N m.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalJointMotorCommand supplies configurePhysicalJointMotor with one command per declared axis. configurePhysicalJointMotor consumes the command produced by physicalJointMotorCommand to set the corresponding native velocity motor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Saturation forecasts demand because the native SDK does not expose achieved motor impulse; it is not an observed torque measurement. An inactive motor has zero cap; finite native representability remains runtime admission before the SDK write.
 */
export namespace IAutoMoviePhysicalJointMotorCommand {
  /**
   * One joint's motor command.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes bounded motor commands, geodesic error and pre-solve saturation forecasts.
   * @evidence contracts/development/design.md#principled-representation axes retain declaration order; error is radians and saturated identifies joint-frame torque demands above their caps.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalJointMotorCommand supplies configurePhysicalJointMotor with one command per declared axis.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Saturation forecasts demand because the native SDK does not expose achieved motor impulse; it is not an observed torque measurement.
   */
  export interface IOutput {
    /** One velocity-motor command per declared axis, in declaration order. */
    axes: IAutoMoviePhysicalJointMotorCommand.IAxis[];

    /** Norm of the declared axes' geodesic error, radians. */
    error: number;

    /** Axes whose forecast demand exceeds their torque cap. */
    saturated: ("x" | "y" | "z")[];
  }

  /**
   * One axis's native velocity-motor command.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis, target speed, implicit damping and torque cap of one native motor.
   * @evidence contracts/development/design.md#principled-representation The axis literal selects a joint-frame coordinate; speed is rad/s, damping N m s/rad and maximumTorque N m.
   * @evidence contracts/development/design.md#minimal-and-owned-surface configurePhysicalJointMotor consumes the command produced by physicalJointMotorCommand to set the corresponding native velocity motor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An inactive motor has zero cap; finite native representability remains runtime admission before the SDK write.
   */
  export interface IAxis {
    /** Joint-frame axis. */
    axis: "x" | "y" | "z";

    /** Target relative angular speed, rad/s. */
    speed: number;

    /** Implicit motor damping, N m s/rad. */
    damping: number;

    /** Motor torque cap, N m; zero for an inactive motor. */
    maximumTorque: number;
  }

  /**
   * The bounded quaternion PD command of one joint for the native implicit
   * velocity motors.
   *
   * A native positional motor measures 2 asin(qi) while using the plain joint
   * axis as its Jacobian, which disagrees under compound rotations. The error is
   * therefore the geodesic rotation vector of target times inverse current, on
   * the short arc. Each axis drives an implicit velocity motor with damping
   * d = (c + k dt) strength-scaled plus passive damping and target speed
   * (k e + c_active w_target + f strength) / d_active+passive, the backward-Euler
   * form of PD with stiffness k = stiffness strength. With positive strength the
   * requested velocity is projected into the joint's twist-limit box for the next
   * substep. The cap is the axis torque when any gain is active and zero
   * otherwise. Saturation is a demand forecast |d (speed - velocity)| > cap,
   * because the native SDK exposes no solved motor impulse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes shortest-arc PD tracking, passive damping, feed-forward and one positive native substep.
   * @evidence contracts/development/design.md#principled-representation Child-relative unit quaternions, joint-frame rad/s velocities and N m feed-forward share the profile joint frame; strength lies in [0,1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalJointMotorCommand reads gains and caps from the canonical profile joint instead of duplicating actuator policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The command uses admitted independent twist limits and bounded native motors; its error and saturation are requests before integration.
   */
  export type IInput = {
    /** Joint whose declared axes, gains and caps are commanded. */ joint: IAutoMoviePhysicalJoint;
    /** Current child-relative joint rotation. */ current: IAutoMovieQuaternion;
    /** Target child-relative joint rotation. */ target: IAutoMovieQuaternion;
    /** Current relative angular velocity in the joint frame, rad/s. */ velocity: IAutoMovieVector3;
    /** Target relative angular velocity in the joint frame, rad/s. */ targetVelocity: IAutoMovieVector3;
    /** Tracking fraction in [0, 1]. */ strength: number;
    /** Optional joint-frame torque feed-forward, N m, scaled by strength. */ feedForward?: IAutoMovieVector3;
    /** Native substep, seconds; positive. */ timestep: number;
  };
}
