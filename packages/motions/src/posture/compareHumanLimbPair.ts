import type {
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * Compare a paired-arm request and its image in the original JSON order:
 * root, name-sorted clinical joint tuples, left goal, right goal. Completed
 * root objects, joint tuples and goal objects are self-delimiting, so their
 * first unequal serialization also decides the enclosing request's order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact representative order, component boundaries and early exit.
 * @evidence contracts/development/implementation.md#principled-implementation Lexicographic comparison stops at the first unequal self-delimiting JSON component; equal prefixes retain the original stable bone-name sort, null clinical lowering and goal property order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparator owns the existing representative choice without constructing two complete request strings; the pair solver and mirror owner remain unchanged.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual original JSON scalar/object serialization without numeric comparison, quantization, target replacement or a new tie rule; equal complete requests return zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Different roots require only root serialization; equal roots sort O(J log J) but serialize only until the first different joint, and goals are serialized only after equal joints. Worst-case data remains O(J+G), without a measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The original sorted joint records are borrowed while each tuple is serialized once in comparison order; no previous request, pose result or representative choice is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary sorted arrays and compared component strings end on return; the function retains no body, pose, goal, numerical result or external handle.
 */
export function compareHumanLimbPair(
  original: IAutoMoviePose,
  goals: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>,
  image: IAutoMoviePose,
  reflected: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>,
): number {
  const root: number = compare(JSON.stringify(original.root), JSON.stringify(image.root));
  if (root !== 0) return root;
  const a: IAutoMovieJointPose[] = [...original.joints].sort(order);
  const b: IAutoMovieJointPose[] = [...image.joints].sort(order);
  for (let i: number = 0; i < Math.min(a.length, b.length); ++i) {
    const joint: number = compare(tuple(a[i]!), tuple(b[i]!));
    if (joint !== 0) return joint;
  }

  // The enclosing array compares its closing bracket after a short prefix
  // against the longer array's comma, so a shorter equal prefix sorts later.
  if (a.length !== b.length) return a.length < b.length ? 1 : -1;
  const left: number = compare(JSON.stringify(goals.left), JSON.stringify(reflected.left));
  return left !== 0 ? left : compare(JSON.stringify(goals.right), JSON.stringify(reflected.right));
}

/** Original strict lexicographic ordering, including exact complete equality. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Original stable name-order comparator; duplicate names retain input order. */
function order(a: IAutoMovieJointPose, b: IAutoMovieJointPose): number {
  return a.bone < b.bone ? -1 : a.bone > b.bone ? 1 : 0;
}

/** Original tuple lowering maps missing clinical axes to JSON null. */
function tuple(joint: IAutoMovieJointPose): string {
  return JSON.stringify([joint.bone, joint.flexion ?? null, joint.abduction ?? null, joint.twist ?? null]);
}
