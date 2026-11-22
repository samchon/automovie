import type {
  IAutoMovieConfigurePhysicalJointMotor,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointMotorCommand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalJointMotorCommand } from "./physicalJointMotorCommand";

/**
 * Apply one joint's bounded quaternion PD command ({@link physicalJointMotorCommand}) to its joint's implicit velocity motors, refusing non-finite values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the command, the motors it sets and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Each free axis's motor receives the command's target speed and implicit damping with the axis's declared torque cap; the solver applies them as a backward-Euler damper.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the command to physicalJointMotorCommand and only stores its result.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-finite command throws instead of reaching the solver.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per free axis.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function configurePhysicalJointMotor(input: {
  world: AutoMovieXpbdWorld;
  native: AutoMovieXpbdJoint;
  joint: IAutoMoviePhysicalJoint;
  current: IAutoMovieQuaternion;
  target: IAutoMovieQuaternion;
  velocity: IAutoMovieVector3;
  targetVelocity: IAutoMovieVector3;
  strength: number;
  feedForward?: IAutoMovieVector3;
}): IAutoMovieConfigurePhysicalJointMotor.IResult {
  const command: IAutoMoviePhysicalJointMotorCommand.IOutput =
    physicalJointMotorCommand({
      ...input,
      timestep: input.world.timestep,
    });
  for (const [index, axis] of command.axes.entries()) {
    if (
      ![axis.speed, axis.damping, input.joint.axes[index]!.maximumTorque].every(
        Number.isFinite,
      )
    )
      throw new Error(
        `Derived joint motor is not finite: ${input.joint.id}/${axis.axis}`,
      );
    input.native.motors.set(axis.axis, {
      speed: axis.speed,
      damping: axis.damping,
      maximumTorque: input.joint.axes[index]!.maximumTorque,
    });
  }
  return { error: command.error, saturated: command.saturated };
}
