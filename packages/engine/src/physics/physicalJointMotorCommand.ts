import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { projectPhysicalJointVelocity } from "./projectPhysicalJointVelocity";

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
 */
export function physicalJointMotorCommand(input: {
  /** Joint whose declared axes, gains and caps are commanded. */ joint: P.IJoint;
  /** Current child-relative joint rotation. */ current: IAutoMovieQuaternion;
  /** Target child-relative joint rotation. */ target: IAutoMovieQuaternion;
  /** Current relative angular velocity in the joint frame, rad/s. */ velocity: IAutoMovieVector3;
  /** Target relative angular velocity in the joint frame, rad/s. */ targetVelocity: IAutoMovieVector3;
  /** Tracking fraction in [0, 1]. */ strength: number;
  /** Optional joint-frame torque feed-forward, N m, scaled by strength. */ feedForward?: IAutoMovieVector3;
  /** Native substep, seconds; positive. */ timestep: number;
}): physicalJointMotorCommand.IOutput {
  const delta: IAutoMovieQuaternion = Quaternion.multiply(
    input.target,
    Quaternion.inverse(input.current),
  );
  const norm: number = Math.hypot(delta.x, delta.y, delta.z);
  const sign: number = delta.w < 0 ? -1 : 1;
  const scale: number =
    norm < 1e-12
      ? 2 * sign
      : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign) / norm;
  const error: IAutoMovieVector3 = {
    x: delta.x * scale,
    y: delta.y * scale,
    z: delta.z * scale,
  };

  // Implicit PD target speed per declared axis.
  const requested: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const axis of input.joint.axes) {
    const k: number = axis.stiffness * input.strength;
    const activeDamping: number =
      axis.damping * input.strength + k * input.timestep;
    const damping: number = activeDamping + (axis.passiveDamping ?? 0);
    requested[axis.axis] =
      damping > 0
        ? (k * error[axis.axis] +
            activeDamping * input.targetVelocity[axis.axis] +
            (input.feedForward?.[axis.axis] ?? 0) * input.strength) /
          damping
        : 0;
  }
  const velocity: IAutoMovieVector3 =
    input.strength > 0
      ? projectPhysicalJointVelocity(
          input.current,
          input.joint.axes,
          requested,
          input.timestep,
        )
      : requested;
  const output: physicalJointMotorCommand.IOutput = {
    axes: [],
    error: 0,
    saturated: [],
  };
  for (const axis of input.joint.axes) {
    const k: number = axis.stiffness * input.strength;
    const damping: number =
      axis.damping * input.strength +
      (axis.passiveDamping ?? 0) +
      k * input.timestep;
    const speed: number = velocity[axis.axis];
    const maximumTorque: number = k + damping > 0 ? axis.maximumTorque : 0;
    output.axes.push({ axis: axis.axis, speed, damping, maximumTorque });
    output.error += error[axis.axis] ** 2;
    if (
      Math.abs(damping * (speed - input.velocity[axis.axis])) >
      axis.maximumTorque
    )
      output.saturated.push(axis.axis);
  }
  output.error = Math.sqrt(output.error);
  return output;
}
/** Output shapes of {@link physicalJointMotorCommand}. */
export namespace physicalJointMotorCommand {
  /** One joint's motor command. */
  export interface IOutput {
    /** One velocity-motor command per declared axis, in declaration order. */
    axes: IAxis[];

    /** Norm of the declared axes' geodesic error, radians. */
    error: number;

    /** Axes whose forecast demand exceeds their torque cap. */
    saturated: ("x" | "y" | "z")[];
  }

  /** One axis's native velocity-motor command. */
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
}
