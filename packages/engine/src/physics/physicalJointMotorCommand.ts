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
 * the short arc. Each axis drives an implicit velocity motor with damping
 * d = (c + k dt) strength-scaled plus passive damping and target speed
 * (k e + c_active w_target + f strength) / d_active+passive, the backward-Euler
 * form of PD with stiffness k = stiffness strength. With positive strength the
 * requested velocity is projected into the joint's twist-limit box for the next
 * substep. The cap is the axis torque when any gain is active and zero
 * otherwise. Saturation is a demand forecast |d (speed - velocity)| > cap at
 * the command's velocity, before the substeps run.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The bounded quaternion PD command of one joint for the solver's implicit velocity motors) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The bounded quaternion PD command of one joint for the solver's implicit velocity motors) directly over its typed inputs (`input`) as 2 sequential passes (for-of over input.joint.axes; for-of over input.joint.axes), delegating to `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 65 lines and 12 top-level statements that reuses `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (for-of over input.joint.axes; for-of over input.joint.axes), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
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
  const output: IAutoMoviePhysicalJointMotorCommand.IOutput = {
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
