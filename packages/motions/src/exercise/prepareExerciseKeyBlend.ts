import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import type { ExerciseKey } from "./ExerciseKey";

/**
 * Prepare the joint union and fixed endpoints of a keyed posture transition.
 *
 * @param a The fixed key at share zero.
 * @param b The fixed key at share one.
 * @returns The same linear joint-space blend as `ExerciseKey.blend` for each share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States immutable endpoints, share convention and equivalence to the raw blend.
 * @evidence contracts/development/implementation.md#principled-implementation Interpolates every trunk scalar and clinical joint component in the original order and arithmetic, with a missing endpoint joint read as zero and full turns kept as authored.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one ordered bone union before one reader of varying share; this function owns both raw and prepared blend arithmetic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, angle or share is clamped or approximated, and every output joint tuple is freshly allocated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation and storage in the endpoint bone union and linear interpolation per read; key enumeration, union construction and missing-endpoint decisions run once per prepared transition.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A returned reader belongs to its two fixed endpoint keys, with no identity-based cache or sharing across unlike key pairs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains the two keys and their ordered endpoint tuples until its owning plan releases it; queried shares do not accumulate.
 */
export function prepareExerciseKeyBlend(
  a: ExerciseKey.IKey,
  b: ExerciseKey.IKey,
): (share: number) => ExerciseKey.IKey {
  const bones: Set<AutoMovieHumanoidBone> = new Set([
    ...Object.keys(a.joints), ...Object.keys(b.joints),
  ] as AutoMovieHumanoidBone[]);
  const endpoints: {
    bone: AutoMovieHumanoidBone;
    from: readonly [number, number, number];
    to: readonly [number, number, number];
  }[] = [];
  for (const bone of bones)
    endpoints.push({ bone, from: a.joints[bone] ?? [0, 0, 0], to: b.joints[bone] ?? [0, 0, 0] });
  return (share: number): ExerciseKey.IKey => {
    const joints: AutoMovieMotionHumanJoints.Angles = {};
    for (const { bone, from, to } of endpoints)
      joints[bone] = [
        from[0] + (to[0] - from[0]) * share,
        from[1] + (to[1] - from[1]) * share,
        from[2] + (to[2] - from[2]) * share,
      ];
    return {
      pitch: a.pitch + (b.pitch - a.pitch) * share,
      roll: a.roll + (b.roll - a.roll) * share,
      yaw: a.yaw + (b.yaw - a.yaw) * share,
      lift: a.lift + (b.lift - a.lift) * share,
      joints,
    };
  };
}
