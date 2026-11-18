import type {
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";

/**
 * Prepare the blend of two fixed exercise keys: linear in joint space, the
 * joints through the one joint-map blend owner (`prepareHumanShapeBlend`,
 * a joint one key leaves out read as zero there) and the tilt, the turn and
 * the lift scalar by scalar.
 *
 * @param a The fixed key at share zero.
 * @param b The fixed key at share one.
 * @returns The key a share of the way from `a` to `b`, the share in [0, 1].
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed endpoints, the share and how each member blends.
 * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation of clinical angles and the trunk's scalars; the turn is blended as written, so a full turn keyed as 360 is not shortened to 0.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint-map blend and four scalars.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, angle or share is clamped or approximated; every output joint tuple is fresh.
 * @evidence contracts/development/implementation.md#efficient-algorithms The joint union and its differences are prepared once; each share is linear in the joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The joints are the shared owner's; nothing is cached by identity here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds the two keys' scalars and the joint blend until its owning plan releases it; no share or result is stored.
 */
export function prepareExerciseKeyBlend(
  a: IAutoMovieMotionHumanExerciseKey.IKey,
  b: IAutoMovieMotionHumanExerciseKey.IKey,
): (share: number) => IAutoMovieMotionHumanExerciseKey.IKey {
  const joints: (weight: number) => IAutoMovieMotionHumanPosture["joints"] =
    prepareHumanShapeBlend(a.joints, b.joints);
  return (share: number): IAutoMovieMotionHumanExerciseKey.IKey => ({
    pitch: a.pitch + (b.pitch - a.pitch) * share,
    roll: a.roll + (b.roll - a.roll) * share,
    yaw: a.yaw + (b.yaw - a.yaw) * share,
    lift: a.lift + (b.lift - a.lift) * share,
    joints: joints(share),
  });
}
