import type {
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * Compare the original complete paired-arm key and then its complete image:
 * root, name-sorted clinical joint tuples, left goal, right goal. Complete
 * lowering and whole-array JSON observation preserve getter/toJSON keys,
 * suffix effects and representative choice for arbitrary public input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original complete lowering, stable name sorting, null clinical values, left-to-right serialization and arbitrary hook observation.
 * @evidence contracts/development/implementation.md#principled-implementation The original <= decision follows full key(original) then full key(image). Each array materializes in original root/sorted-tuples/goals order before whole JSON serialization, preserving callback keys/effects and the original false comparison when an outer toJSON returns undefined.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One key owner and the original <= comparison preserve representative choice; valid equal strings return zero, and callback-produced unordered values retain the original image branch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No early exit skips suffix observations, no component root key replaces the original array index, and no numeric/grid/tolerance/tie rule substitutes for the complete original serialization.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each side sorts J references in O(J log J), lowers every clinical tuple and serializes O(J+G) data. Complete work is required by observable arbitrary input hooks; no unsupported pure-data assumption is used and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing lowering/JSON owners are shared structurally, while effectful original/image observations execute independently in their original order. No previous key, representative or physical result is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Two complete key strings and temporary sorted/tuple arrays end on return or throw; no source, callback, numerical result, history or handle is retained.
 */
export function compareHumanLimbPair(
  original: IAutoMoviePose,
  goals: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>,
  image: IAutoMoviePose,
  reflected: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>,
): number {
  const a: string = key(original, goals);
  const b: string = key(image, reflected);
  return a <= b ? a === b ? 0 : -1 : 1;
}

/** Materialize every original array component before the complete left-to-right JSON observation. */
function key(pose: IAutoMoviePose, goals: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>): string {
  return JSON.stringify([pose.root, [...pose.joints].sort(order).map(
    (joint: IAutoMovieJointPose): readonly [IAutoMovieJointPose["bone"], number | null, number | null, number | null] =>
      [joint.bone, joint.flexion ?? null, joint.abduction ?? null, joint.twist ?? null],
  ), goals.left, goals.right]);
}

/** Original stable name-order comparator; duplicate names retain input order. */
function order(a: IAutoMovieJointPose, b: IAutoMovieJointPose): number {
  return a.bone < b.bone ? -1 : a.bone > b.bone ? 1 : 0;
}

