import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";

/**
 * Place each grip using a pole carried by the climber's trunk through the reach.
 * The wrist follows the rung while the elbow remains on its anatomical side.
 *
 * @param body The climber's measured skeleton and grip geometry.
 * @param normal The ladder's outward world normal.
 * @returns A limb goal for the ordinary bounded two-bone fit at a rung or between rungs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both geometric frames.
 * @evidence contracts/development/implementation.md#principled-implementation The wrist fixes the chain endpoint and the trunk-relative elbow pole fixes its bend plane through each rung transfer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader places the requested wrist, constructs its torso-relative pole and assembles the goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same rung point and real arm fit retain contact and joint limits at each sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The rung's normal and axis and the hands' grip offsets remain fixed for this climb. Each requested posture supplies its own pole.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The climb owns two frames and offsets. Returned goals retain no earlier pose or fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two prepared hand frames and grip offsets serve the climb. Each goal constructs its pole directly and the posture solver checks the actual arm configuration.
 */
export function climbLadderHands(
  body: IAutoMovieMotionHumanBody,
  normal: IAutoMovieVector3,
): (side: AutoMovieHumanSide, posture: IAutoMovieMotionHumanPosture, point: IAutoMovieVector3) => IAutoMovieHumanLimbGoal {
  // The grip socket points toward the thumb along the grasped cylinder.
  const along: IAutoMovieVector3 = Vector3.cross({ x: 0, y: 1, z: 0 }, normal);
  const frames: Record<AutoMovieHumanSide, ReturnType<typeof HumanHandTarget.prepareFrame>> = {
    left: HumanHandTarget.prepareFrame(body, "left", normal, { surface: "grip", shape: "relaxed", forward: along }),
    right: HumanHandTarget.prepareFrame(body, "right", normal, { surface: "grip", shape: "relaxed", forward: Vector3.scale(along, -1) }),
  };
  const contacts: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: HumanHand.offset(body, "left", "grip", "relaxed").point,
    right: HumanHand.offset(body, "right", "grip", "relaxed").point,
  };
  return (side: AutoMovieHumanSide, posture: IAutoMovieMotionHumanPosture, point: IAutoMovieVector3): IAutoMovieHumanLimbGoal => {
    const wrist: IAutoMovieMotionHumanHand.IWrist = frames[side](posture).place(point);
    const pole: IAutoMovieVector3 = AutoMovieMotionHumanBend.arm(body, posture, side, "hang");
    return AutoMovieMotionHumanArmTarget.fromWrist(wrist, pole, { ...contacts[side] });
  };
}
