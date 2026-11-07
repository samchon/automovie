import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { ImpulseJoint, World } from "@dimforge/rapier3d-compat";

import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";
import { physicalJointMotorCommand } from "./physicalJointMotorCommand";

/** Apply one joint's bounded quaternion PD command ({@link physicalJointMotorCommand}) to its native implicit velocity motors, refusing values outside the native f32 range. */
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
