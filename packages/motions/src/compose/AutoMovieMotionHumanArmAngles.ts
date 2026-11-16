import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import type { HumanHand } from "../posture/HumanHand";

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
   * One arm's joint angles: the clinical flexion, abduction and twist of the
   * upper arm, the forearm and the hand, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which joints are held, the order of each triple and the unit.
   * @evidence contracts/development/design.md#principled-representation An arm that travels freely is described by its joint angles, the coordinates a free arm movement is smooth in (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the three joints the arm channel owns; read by `angles` and `carry`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each triple is the posture's own joint triple, so it is written back without conversion.
   */
  export interface IAngles {
    /** The upper arm's flexion, abduction and twist. */
    upper: readonly [number, number, number];

    /** The forearm's flexion, abduction and twist. */
    lower: readonly [number, number, number];

    /** The hand's flexion, abduction and twist. */
    hand: readonly [number, number, number];

    /** The fingers' joints of that hand as the arm holds them, read off the pose with the arm; the posture's own when absent. */
    fingers?: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;
  }

  /**
   * An arm's joint angles read off a solved pose.
   *
   * @param pose The pose.
   * @param side The arm.
   * @returns The angles; a joint the pose does not carry reads zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and what a missing joint reads.
   * @evidence contracts/development/implementation.md#principled-implementation The pose already holds each joint's clinical triple, so the angles are read and never re-derived from bone directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered pass captures the first three arm records and original last-value digit records, then constructs the same clinical triples.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing joint is the rest angle, zero, the value the resolver gives an unset joint.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(J) pass over J joints replaces three find scans plus the digit scan; output still contains the same three fresh arm triples and F fresh digit triples, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The arm and digit observations share one traversal of the same immutable canonical input; duplicate arm names retain first-match semantics while digit assignments retain original last-value semantics and insertion order.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function angles(pose: IAutoMoviePose, side: HumanHand.Side): IAngles {
    const read: (joint: IAutoMovieJointPose | undefined) => readonly [number, number, number] = (
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
