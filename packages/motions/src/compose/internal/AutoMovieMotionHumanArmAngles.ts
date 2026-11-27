import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmAngles,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../../posture/internal/HumanArmClearance";

/**
 * An arm's joint angles and their reader: what an arm carried in joint space
 * holds and is written as (AutoMovieMotionHumanArmCarry,
 * AutoMovieMotionHumanArmPlanned), and what AutoMovieMotionHumanArm names.
 */
export namespace AutoMovieMotionHumanArmAngles {
  /**
   * An arm's joint angles read off a solved pose.
   *
   * @param pose The pose.
   * @param side The arm.
   * @returns The angles; a joint the pose does not carry reads zero.
   */
  export function angles(
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmAngles.IAngles {
    const read: (
      joint: IAutoMovieJointPose | undefined,
    ) => readonly [number, number, number] = (
      joint: IAutoMovieJointPose | undefined,
    ): readonly [number, number, number] => {
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const upperBone: AutoMovieHumanoidBone = `${side}UpperArm`;
    const lowerBone: AutoMovieHumanoidBone = `${side}LowerArm`;
    const handBone: AutoMovieHumanoidBone = `${side}Hand`;
    let upper: IAutoMovieJointPose | undefined;
    let lower: IAutoMovieJointPose | undefined;
    let hand: IAutoMovieJointPose | undefined;
    const fingers: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const joint of pose.joints) {
      if (joint.bone === upperBone && upper === undefined) upper = joint;
      if (joint.bone === lowerBone && lower === undefined) lower = joint;
      if (joint.bone === handBone && hand === undefined) hand = joint;
      if (
        HumanArmClearance.DIGITS.test(joint.bone) &&
        joint.bone.startsWith(side)
      )
        fingers[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    }
    return {
      upper: read(upper),
      lower: read(lower),
      hand: read(hand),
      fingers,
    };
  }
}
