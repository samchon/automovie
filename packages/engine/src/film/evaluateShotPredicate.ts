import {
  IAutoMovieCompiledPredicateResult,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  IAutoMovieShotPredicate,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IShotContractSubjectReader } from "./IShotContractSubjectReader";

/**
 * Measure one typed shot-contract predicate in the compiled artifacts at a
 * shot-local second and compare it with its declared value.
 *
 * A `joint-angle` predicate reads the actor's sampled pose: the joint's angle
 * on the named axis, or zero when the pose leaves that joint at rest. A
 * `position` predicate reads one world coordinate of its selector, and a
 * `distance` predicate the Euclidean distance in metres between two selectors.
 * `==` passes within `tolerance` either way, `<=` passes up to
 * `value + tolerance`, and `>=` from `value - tolerance`.
 *
 * A reference the reader cannot resolve, such as an absent node, a rig without
 * the named bone, an uncompiled motion, an absent landmark or an uncompiled
 * formation, records `actual: null` and fails, so an unmeasurable claim never
 * passes.
 *
 * @param reader The subject reader of the grading call.
 * @param predicate The contract predicate to measure.
 * @param time Shot-local seconds to measure at.
 * @returns The predicate, the measured scalar or `null`, and whether it passed.
 *
 * @evidence contracts/common.md#principled-implementation Each kind is measured directly from the reader's placements and poses, the distance with `Math.hypot`, and the comparison widens the declared value by the declared tolerance on the side the operator constrains; a bone the rig does not declare is refused before sampling, because a pose with no entry for a joint means rest only for a joint the rig has.
 * @evidence contracts/common.md#clear-and-simple-design One function per predicate is what the opening, closing and event grades of `realizeShotContract` share, and the reader supplies every lookup, so the measurement holds no index or props of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catch covers only the reader's documented refusals, turning them into the failing `null` measurement the record defines; no actor, bone, axis or selector is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what each kind measures and in which unit, the pass rule for each operator, and that an unresolvable reference records `null` and fails.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per predicate beyond the reader's sampling: one bone scan of the rig and one joint scan of the pose for a joint angle, linear in the rig's bone count, and at most two placements for a position or distance.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measures one predicate per call; sampling shared across predicates at the same instant is cached by the reader it is given.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned result references the caller's predicate and holds one number.
 */
export const evaluateShotPredicate = (
  reader: IShotContractSubjectReader,
  predicate: IAutoMovieShotPredicate,
  time: number,
): IAutoMovieCompiledPredicateResult => {
  let actual: number | null = null;
  try {
    actual = measure(reader, predicate, time);
  } catch {
    actual = null;
  }
  return {
    predicate,
    actual,
    passed:
      actual !== null &&
      (predicate.operator === "=="
        ? Math.abs(actual - predicate.value) <= predicate.tolerance
        : predicate.operator === "<="
          ? actual <= predicate.value + predicate.tolerance
          : actual >= predicate.value - predicate.tolerance),
  };
};

/** The scalar a predicate compares; throws when a reference does not resolve. */
const measure = (
  reader: IShotContractSubjectReader,
  predicate: IAutoMovieShotPredicate,
  time: number,
): number => {
  if (predicate.kind === "position")
    return reader.spatialAt(predicate.subject, time)[predicate.axis];
  if (predicate.kind === "distance") {
    const from: IAutoMovieVector3 = reader.spatialAt(predicate.from, time);
    const to: IAutoMovieVector3 = reader.spatialAt(predicate.to, time);
    return Math.hypot(from.x - to.x, from.y - to.y, from.z - to.z);
  }
  const node: IAutoMovieSceneNode | undefined = reader.node(predicate.actor);
  if (node === undefined) throw new Error(`node "${predicate.actor}" is absent`);
  const rig: IAutoMovieSkeleton | null = reader.skeleton(node);
  if (
    rig === null ||
    rig.bones.some(
      (bone: IAutoMovieSkeleton["bones"][number]): boolean =>
        bone.bone === predicate.bone,
    ) === false
  )
    throw new Error(`node "${predicate.actor}" has no bone "${predicate.bone}"`);
  const pose: IAutoMoviePose = reader.poseAt(node, time);
  const joint: IAutoMoviePose["joints"][number] | undefined = pose.joints.find(
    (item: IAutoMoviePose["joints"][number]): boolean =>
      item.bone === predicate.bone,
  );
  return joint?.[predicate.axis] ?? 0;
};
