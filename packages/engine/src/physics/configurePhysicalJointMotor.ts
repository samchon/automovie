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
