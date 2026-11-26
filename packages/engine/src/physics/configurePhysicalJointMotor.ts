import type {
  IAutoMovieConfigurePhysicalJointMotor,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointMotorCommand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalJointMotorCommand } from "./internal/physicalJointMotorCommand";

/**
 * Apply one joint's bounded quaternion PD command
 * ({@link physicalJointMotorCommand}) to its joint's implicit velocity motors,
 * each with its axis's declared torque bound in both directions, refusing
 * non-finite values.
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
  stiffnessScale?: number;
  dampingScale?: number;
}): IAutoMovieConfigurePhysicalJointMotor.IResult {
  const command: IAutoMoviePhysicalJointMotorCommand.IOutput =
    physicalJointMotorCommand({
      ...input,
      timestep: input.world.timestep,
    });
  // The posture alone: the same PD without its feed-forward torque, which a
  // support cascade's posture rows track as motion (`solveXpbdSupportCascade`).
  const posture: IAutoMoviePhysicalJointMotorCommand.IOutput | undefined =
    input.feedForward === undefined
      ? undefined
      : physicalJointMotorCommand({
          ...input,
          feedForward: undefined,
          timestep: input.world.timestep,
        });
  for (const [index, axis] of command.axes.entries()) {
    const declared: IAutoMoviePhysicalJoint["axes"][number] =
      input.joint.axes[index]!;
    // A driven motor keeps both directions' bounds, so a solve that turns
    // its impulse against the PD's own demand, as the support cascade may,
    // still meets that direction's own strength; an undriven one has none.
    const active: boolean = axis.maximumTorque > 0;
    const forward: number = active ? declared.maximumTorque : 0;
    const reverse: number = active
      ? (declared.reverseTorque ?? declared.maximumTorque)
      : 0;
    const target: number = posture ? posture.axes[index]!.speed : axis.speed;
    input.native.motors.set(axis.axis, {
      speed: axis.speed,
      damping: axis.damping,
      maximumTorque: forward,
      ...(reverse !== forward ? { reverseTorque: reverse } : {}),
      ...(target !== axis.speed ? { target } : {}),
    });
  }
  return { error: command.error, saturated: command.saturated };
}
