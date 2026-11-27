import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/*
 * Blend one joint of a joint record toward a gaze's angles: each of its
 * clinical flexion, abduction and twist moves from the record's own (zero where
 * it holds none) toward the asked angle by the weight.
 * Parameter joints: The record, written in place.
 * Parameter bone: The joint.
 * Parameter flexion: The asked flexion, clinical degrees.
 * Parameter abduction: The asked abduction, clinical degrees.
 * Parameter twist: The asked twist, clinical degrees.
 * Parameter weight: How far toward the asked angles, in [0, 1].
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
