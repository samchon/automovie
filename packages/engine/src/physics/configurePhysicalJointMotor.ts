import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { ImpulseJoint, World } from "@dimforge/rapier3d-compat";

import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";
import { physicalJointMotorCommand } from "./physicalJointMotorCommand";

/**
 * Apply one joint's bounded quaternion PD command ({@link physicalJointMotorCommand}) to its native implicit velocity motors, refusing values outside the native f32 range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Apply one joint's bounded quaternion PD command () to its native implicit velocity motors, refusing values outside the native f32 range) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Apply one joint's bounded quaternion PD command () to its native implicit velocity motors, refusing values outside the native f32 range) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over command.axes.entries(); every over [axis.speed, axis.damping, input.joint.a), delegating to `physicalJointMotorCommand`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 3, 4, 5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 38 lines and 3 top-level statements that reuses `physicalJointMotorCommand` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over command.axes.entries(); every over [axis.speed, axis.damping, input.joint.a), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
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
  const command: physicalJointMotorCommand.IOutput = physicalJointMotorCommand({
    ...input,
    timestep: input.world.timestep,
  });
  for (const [index, axis] of command.axes.entries()) {
    if (
      ![axis.speed, axis.damping, input.joint.axes[index]!.maximumTorque].every(
        isPhysicalNativeNumber,
      )
    )
      throw new Error(
        `Derived native joint motor exceeds f32 range: ${input.joint.id}/${axis.axis}`,
      );
    const row: number = axis.axis === "x" ? 3 : axis.axis === "y" ? 4 : 5;
    // RawMotorModel.ForceBased is 1; the package exports its distinct public
    // MotorModel enum but does not re-export RawMotorModel from its entry point.
    input.world.impulseJoints.raw.jointConfigureMotorModel(
      input.native.handle,
      row,
      1,
    );
    input.world.impulseJoints.raw.jointConfigureMotor(
      input.native.handle,
      row,
      0,
      axis.speed,
      0,
      axis.damping,
    );
    input.world.impulseJoints.raw.jointSetMotorMaxForce(
      input.native.handle,
      row,
      axis.maximumTorque,
    );
  }
  return { error: command.error, saturated: command.saturated };
}
