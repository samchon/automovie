import type {
  IAutoMoviePhysicalJointMotorCommand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { projectPhysicalJointVelocity } from "./projectPhysicalJointVelocity";

/**
 * The bounded quaternion PD command of one joint for the solver's implicit
 * velocity motors.
 *
 * A per-axis positional motor measuring 2 asin(qi) while using the plain joint
 * axis as its Jacobian disagrees under compound rotations. The error is
 * therefore the geodesic rotation vector of target times inverse current, on
 * the short arc. Each axis drives an implicit velocity motor with damping d =
 * (c + k dt) strength-scaled plus passive damping and target speed (k e +
 * c_active w_target + f strength) / d_active+passive, the backward-Euler form
 * of PD with stiffness k = stiffness strength. With positive strength the
 * requested velocity is projected into the joint's limit box for the next
 * substep, read in its chart when it declares one, as the solver limits it. The
 * cap is the axis torque when any gain is active and zero otherwise. Saturation
 * is a demand forecast |d (speed - velocity)| > cap at the command's velocity,
 * before the substeps run.
 */
export function physicalJointMotorCommand(
  input: IAutoMoviePhysicalJointMotorCommand.IInput,
): IAutoMoviePhysicalJointMotorCommand.IOutput {
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
    const k: number =
      axis.stiffness * input.strength * (input.stiffnessScale ?? 1);
    const activeDamping: number =
      axis.damping * input.strength * (input.dampingScale ?? 1) +
      k * input.timestep;
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
          input.joint.order,
        )
      : requested;
  const output: IAutoMoviePhysicalJointMotorCommand.IOutput = {
    axes: [],
    error: 0,
    saturated: [],
  };
  for (const axis of input.joint.axes) {
    const k: number =
      axis.stiffness * input.strength * (input.stiffnessScale ?? 1);
    const damping: number =
      axis.damping * input.strength * (input.dampingScale ?? 1) +
      (axis.passiveDamping ?? 0) +
      k * input.timestep;
    const speed: number = velocity[axis.axis];
    // The torque this step drives toward one end of the axis; a joint whose
    // two directions differ in strength is bounded by that direction's.
    const demand: number = damping * (speed - input.velocity[axis.axis]);
    const bound: number =
      demand < 0
        ? (axis.reverseTorque ?? axis.maximumTorque)
        : axis.maximumTorque;
    const maximumTorque: number = k + damping > 0 ? bound : 0;
    output.axes.push({ axis: axis.axis, speed, damping, maximumTorque });
    output.error += error[axis.axis] ** 2;
    if (Math.abs(demand) > bound) output.saturated.push(axis.axis);
  }
  output.error = Math.sqrt(output.error);
  return output;
}
