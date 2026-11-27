import {
  IAutoMovieCompiledPredicateResult,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  type IAutoMovieShotContractSubjectReader,
  IAutoMovieShotPredicate,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Measure one typed shot-contract predicate in the compiled artifacts at a
 * shot-local second and compare it with its declared value.
 *
 * A `joint-angle` predicate reads the actor's sampled pose: the joint's angle
 * on the named axis, or zero when the pose leaves that joint at rest. A
 * `position` predicate reads one world coordinate of its selector, and a
 * `distance` predicate the Euclidean distance in metres between two selectors.
 * `==` passes within `tolerance` either way, `<=` passes up to `value +
 * tolerance`, and `>=` from `value - tolerance`.
 *
 * A reference the reader cannot resolve, such as an absent node, a rig without
 * the named bone, an uncompiled motion, an absent landmark or an uncompiled
 * formation, records `actual: null` and fails. A non-finite derived measurement
 * and any exception during measurement become that same failed null result;
 * missing-reference errors are not distinguished from unexpected sampling
 * errors here, so this record alone cannot diagnose the underlying exception.
 * Predicate values, operators and tolerances are caller-admitted finite data.
 * Parameter reader: The subject reader of the grading call.
 * Parameter predicate: The contract predicate to measure.
 * Parameter time: Shot-local seconds to measure at.
 * Returns: The predicate, the measured scalar or `null`, and whether it passed.
 */
export function evaluateShotPredicate(
  reader: IAutoMovieShotContractSubjectReader,
  predicate: IAutoMovieShotPredicate,
  time: number,
): IAutoMovieCompiledPredicateResult {
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
}

/*
 * The scalar a predicate compares; throws when a reference does not resolve.
 */
function measure(
  reader: IAutoMovieShotContractSubjectReader,
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
  if (node === undefined)
    throw new Error(`node "${predicate.actor}" is absent`);
  const rig: IAutoMovieSkeleton | null = reader.skeleton(node);
  if (
    rig === null ||
    rig.bones.some(
      (bone: IAutoMovieSkeleton["bones"][number]): boolean =>
        bone.bone === predicate.bone,
    ) === false
  )
    throw new Error(
      `node "${predicate.actor}" has no bone "${predicate.bone}"`,
    );
  const pose: IAutoMoviePose = reader.poseAt(node, time);
  const joint: IAutoMoviePose["joints"][number] | undefined = pose.joints.find(
    (item: IAutoMoviePose["joints"][number]): boolean =>
      item.bone === predicate.bone,
  );
  return joint?.[predicate.axis] ?? 0;
}
