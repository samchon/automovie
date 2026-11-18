import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * Blend one joint of a joint record toward a gaze's angles: each of its
 * clinical flexion, abduction and twist moves from the record's own (zero
 * where it holds none) toward the asked angle by the weight.
 *
 * @param joints The record, written in place.
 * @param bone The joint.
 * @param flexion The asked flexion, clinical degrees.
 * @param abduction The asked abduction, clinical degrees.
 * @param twist The asked twist, clinical degrees.
 * @param weight How far toward the asked angles, in [0, 1].
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the record written, the angles' units, the zero default and the weight's range.
 * @evidence contracts/development/implementation.md#principled-implementation A linear blend per clinical component, so weight 0 keeps the joint and weight 1 sets the asked angles.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one write, shared by the gaze's neck, head and eye solves.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp: the caller asks angles inside the joint's range.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Writes one fresh triple and retains nothing.
 */
export function blendGazeJoint(
  joints: IAutoMovieMotionHumanPosture["joints"],
  bone: AutoMovieHumanoidBone,
  flexion: number,
  abduction: number,
  twist: number,
  weight: number,
): void {
  const base: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
  joints[bone] = [
    base[0] + (flexion - base[0]) * weight,
    base[1] + (abduction - base[1]) * weight,
    base[2] + (twist - base[2]) * weight,
  ];
}
