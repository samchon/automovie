import type {
  AutoMovieHumanoidBone,
  IAutoMovieLoftSectionSource,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanJoints,
} from "@automovie/interface";

import type { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import type { ExerciseKey } from "./ExerciseKey";

/**
 * Prepare the joint union and fixed endpoints of a keyed posture transition.
 *
 * @param a The fixed key at share zero.
 * @param b The fixed key at share one.
 * @returns The same linear joint-space blend as `ExerciseKey.blend` for each share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed endpoints, share convention and the prepared reader's linear joint-space result; the raw companion preserves live endpoint observation without requiring fixed keys.
 * @evidence contracts/development/implementation.md#principled-implementation Both paths share clinical tuple interpolation and the original pitch, roll, yaw and lift arithmetic. Raw reads first form the ordered union, then read a and b for one bone and finish all its scalar work before reading the next bone; missing joints are zero and full turns remain authored.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One blend kernel distinguishes raw ordered reads from prepared endpoint traversal, then uses one tuple owner and one trunk-result construction; ExerciseKey.blend delegates to its raw branch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, angle or share is clamped or approximated. The raw branch neither captures later bones early nor imposes immutability, and every output joint tuple is freshly allocated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Both paths are linear in the ordered bone union. Preparation resolves that union and endpoint tuples once; raw blending retains its single ordered read-and-interpolate pass without building an endpoint snapshot.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A returned reader belongs to its two fixed endpoint keys, with no identity-based cache or sharing across unlike pairs. Raw calls reuse only arithmetic and enumerate their actual current keys on every call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One prepared reader retains the two keys and their ordered endpoint tuples until its owning plan releases it; raw calls retain nothing after returning, and neither path stores queried shares or results.
 */
export function prepareExerciseKeyBlend(
  a: IAutoMovieMotionHumanExerciseKey.IKey,
  b: IAutoMovieMotionHumanExerciseKey.IKey,
): (share: number) => IAutoMovieMotionHumanExerciseKey.IKey {
  const endpoints: IAutoMovieLoftSectionSource.IEndpoint[] = [];
  for (const bone of bones(a, b))
    endpoints.push({ bone, from: a.joints[bone] ?? [0, 0, 0], to: b.joints[bone] ?? [0, 0, 0] });
  return (share: number): IAutoMovieMotionHumanExerciseKey.IKey => blend(a, b, share, endpoints);
}

/**
 * The live-key entry to the same numerical blend owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes one raw blend from a fixed-key reader and preserves current endpoint getter and arithmetic order.
 * @evidence contracts/development/design.md#principled-representation The raw member returns one ordinary ExerciseKey while the main function returns a fixed-endpoint share reader; neither adds a second joint convention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The raw companion exists for ExerciseKey.blend so callers retain its original live-key behavior while workout and swim keep their explicit prepared readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both entries use the same tuple and trunk arithmetic; raw blending has no preparation precondition, result cache or early endpoint snapshot.
 */
export namespace prepareExerciseKeyBlend {
  /**
   * Form the current ordered union, then read and interpolate one bone at a
   * time before constructing the trunk scalars in their original order.
   * No input is retained and fixed or immutable endpoints are not required.
   */
  export function raw(a: IAutoMovieMotionHumanExerciseKey.IKey, b: IAutoMovieMotionHumanExerciseKey.IKey, share: number): IAutoMovieMotionHumanExerciseKey.IKey {
    return blend(a, b, share);
  }
}

/** A prepared pair keeps its original tuple references in union order. */
interface IEndpoint {
  bone: AutoMovieHumanoidBone;
  from: readonly [number, number, number];
  to: readonly [number, number, number];
}

/** Preserve first occurrence order from a's keys followed by b's keys. */
function bones(a: IAutoMovieMotionHumanExerciseKey.IKey, b: IAutoMovieMotionHumanExerciseKey.IKey): Set<AutoMovieHumanoidBone> {
  return new Set([
    ...Object.keys(a.joints), ...Object.keys(b.joints),
  ] as AutoMovieHumanoidBone[]);
}

/** Keep raw observations interleaved with each complete tuple's arithmetic. */
function blend(
  a: IAutoMovieMotionHumanExerciseKey.IKey,
  b: IAutoMovieMotionHumanExerciseKey.IKey,
  share: number,
  endpoints?: readonly IAutoMovieLoftSectionSource.IEndpoint[],
): IAutoMovieMotionHumanExerciseKey.IKey {
  const joints: IAutoMovieMotionHumanJoints.Angles = {};
  if (endpoints === undefined)
    for (const bone of bones(a, b)) {
      const from: readonly [number, number, number] = a.joints[bone] ?? [0, 0, 0];
      const to: readonly [number, number, number] = b.joints[bone] ?? [0, 0, 0];
      joints[bone] = angles(from, to, share);
    }
  else
    for (const { bone, from, to } of endpoints)
      joints[bone] = angles(from, to, share);
  return {
    pitch: a.pitch + (b.pitch - a.pitch) * share,
    roll: a.roll + (b.roll - a.roll) * share,
    yaw: a.yaw + (b.yaw - a.yaw) * share,
    lift: a.lift + (b.lift - a.lift) * share,
    joints,
  };
}

/** The original component access and interpolation grouping for one tuple. */
function angles(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  share: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * share,
    from[1] + (to[1] - from[1]) * share,
    from[2] + (to[2] - from[2]) * share,
  ];
}
