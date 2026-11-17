import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";

/**
 * An arm's joint angles and their reader: what an arm carried in joint
 * space holds and is written as (AutoMovieMotionHumanArmCarry,
 * AutoMovieMotionHumanArmPlanned), and what AutoMovieMotionHumanArm
 * names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two things the file holds and who reads them.
 * @evidence contracts/development/design.md#principled-representation A free arm movement is described by its joint angles (Soechting and Lacquaniti 1981), read off a solved pose rather than re-derived.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The angles record and its reader, which both the carry and the planned arm read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each triple is the posture's own joint triple, so it is written back without conversion.
 */
export namespace AutoMovieMotionHumanArmAngles {
  /**
   * An arm's joint angles read off a solved pose.
   *
   * @param pose The pose.
   * @param side The arm.
   * @returns The angles; a joint the pose does not carry reads zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and what a missing joint reads.
   * @evidence contracts/development/implementation.md#principled-implementation The pose already holds each joint's clinical triple, so the angles are read and never re-derived from bone directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three lookups.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing joint is the rest angle, zero, the value the resolver gives an unset joint.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three scans of the pose's joints with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function angles(
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmAngles.IAngles {
    const read = (
      bone: AutoMovieHumanoidBone,
    ): readonly [number, number, number] => {
      const joint = pose.joints.find((j): boolean => j.bone === bone);
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const fingers: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const joint of pose.joints)
      if (
        HumanArmClearance.DIGITS.test(joint.bone) &&
        joint.bone.startsWith(side)
      )
        fingers[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    return {
      upper: read(`${side}UpperArm`),
      lower: read(`${side}LowerArm`),
      hand: read(`${side}Hand`),
      fingers,
    };
  }
}
