import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { ImpulseJoint, World } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";
import { projectPhysicalJointVelocity } from "./projectPhysicalJointVelocity";

/** Configure bounded quaternion PD through the native implicit velocity motors.
 * A native positional motor measures 2 asin(qi) while using the plain joint
 * axis as its Jacobian. That pair disagrees under compound rotations. Compute
 * the geodesic error as a joint-frame torque demand instead, and use the
 * velocity row for implicit damping and articulated load propagation. The
 * requested velocity respects the actual twist-limit differential. Saturation
 * remains a demand forecast because the SDK exposes no solved motor impulse.
 */
export function configurePhysicalJointMotor(input: {
  world: World;
  native: ImpulseJoint;
  joint: P.IJoint;
  current: IAutoMovieQuaternion;
  target: IAutoMovieQuaternion;
  velocity: IAutoMovieVector3;
  targetVelocity: IAutoMovieVector3;
  strength: number;
  feedForward?: IAutoMovieVector3;
}): { error: number; saturated: ("x" | "y" | "z")[] } {
  const result: { error: number; saturated: ("x" | "y" | "z")[] } = {
    error: 0,
    saturated: [],
  };
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
  const requested: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const axis of input.joint.axes) {
    const k: number = axis.stiffness * input.strength;
    const activeDamping: number =
      axis.damping * input.strength + k * input.world.timestep;
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
          input.world.timestep,
        )
      : requested;
  for (const axis of input.joint.axes) {
    const k: number = axis.stiffness * input.strength;
    const d: number =
      axis.damping * input.strength +
      (axis.passiveDamping ?? 0) +
      k * input.world.timestep;
    const speed: number = velocity[axis.axis];
    if (![speed, d, axis.maximumTorque].every(isPhysicalNativeNumber))
      throw new Error(
        `Derived native joint motor exceeds f32 range: ${input.joint.id}/${axis.axis}`,
      );
    const index: number = axis.axis === "x" ? 3 : axis.axis === "y" ? 4 : 5;
    // RawMotorModel.ForceBased is 1; the package exports its distinct public
    // MotorModel enum but does not re-export RawMotorModel from its entry point.
    input.world.impulseJoints.raw.jointConfigureMotorModel(
      input.native.handle,
      index,
      1,
    );
    input.world.impulseJoints.raw.jointConfigureMotor(
      input.native.handle,
      index,
      0,
      speed,
      0,
      d,
    );
    input.world.impulseJoints.raw.jointSetMotorMaxForce(
      input.native.handle,
      index,
      k + d > 0 ? axis.maximumTorque : 0,
    );
    result.error += error[axis.axis] ** 2;
    if (Math.abs(d * (speed - input.velocity[axis.axis])) > axis.maximumTorque)
      result.saturated.push(axis.axis);
  }
  result.error = Math.sqrt(result.error);
  return result;
}
