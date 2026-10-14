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
 * Measure one typed shot-contract predicate in the compiled artifacts at a shot-local second and compare it with its declared value.
 *
 * A `joint-angle` predicate reads the actor's sampled pose: the joint's angle on the named axis, or zero when the pose leaves that joint at rest. A `position` predicate reads one world coordinate of its selector, and a `distance` predicate the Euclidean distance in metres between two selectors. `==` passes within `tolerance` either way, `<=` passes up to `value + tolerance`, and `>=` from `value - tolerance`.
 *
 * A reference the reader cannot resolve, such as an absent node, a rig without the named bone, an uncompiled motion, an absent landmark or an uncompiled formation, records `actual: null` and fails. A non-finite derived measurement and any exception during measurement become that same failed null result; missing-reference errors are not distinguished from unexpected sampling errors here, so this record alone cannot diagnose the underlying exception. Predicate values, operators and tolerances are caller-admitted finite data.
 *
 * @param reader The subject reader of the grading call.
 * @param predicate The contract predicate to measure.
 * @param time Shot-local seconds to measure at.
 * @returns The predicate, the measured scalar or `null`, and whether it passed.
 *
 * @evidence contracts/common.md#principled-implementation Each kind is measured directly from the reader's placements and poses, the distance with `Math.hypot`, and the comparison widens the declared value by the declared tolerance on the side the operator constrains; a bone the rig does not declare is refused before sampling, because a pose with no entry for a joint means rest only for a joint the rig has.
 * @evidence contracts/common.md#clear-and-simple-design One function per predicate is what the opening, closing and event grades of `realizeShotContract` share, and the reader supplies every lookup, so the measurement holds no index or props of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor, bone, axis or selector is special-cased; every measurement exception becomes a failing null result. The broad catch does not classify exceptions, so an unexpected sampling defect is indistinguishable from a documented missing-reference refusal in this output, a diagnostic limitation rather than evidence that only expected failures were caught.
 * @evidence contracts/common.md#meaningful-documentation States each measurement's unit, operator tolerance, null failure for unresolved references and the broader exception-to-null behavior whose output cannot recover the underlying cause.
 * @evidence contracts/performance.md#efficient-algorithms Local joint-angle work scans rig bones and sampled pose joints; position and distance read at most two placements. The reader's pose, spatial and rig operations add their own delegated cost, which this wrapper does not bound.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measures one predicate per call; the supplied reader caches object-channel samples and model extents within the grading call, while poseAt samples motion again for each pose read.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned result references the caller's predicate and holds one number.
 */
export function evaluateShotPredicate (
  reader: IShotContractSubjectReader,
  predicate: IAutoMovieShotPredicate,
  time: number,
): IAutoMovieCompiledPredicateResult {
  let actual: number | null = null;
  try {
    actual = measure(reader, predicate, time);
  } catch {
    actual = null;
  }
  if (actual !== null && !Number.isFinite(actual)) actual = null;
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
}

/** The scalar a predicate compares; throws when a reference does not resolve. */
function measure (
  reader: IShotContractSubjectReader,
  predicate: IAutoMovieShotPredicate,
  time: number,
): number {
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
}
