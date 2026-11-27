import { AutoMovieEngineKinematics, AutoMovieEngineSkeletonPose } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

/*
 * Every bone of a canonical pose placed in the world, by name: forward
 * kinematics with the canonical joint axes and rest frames, the reading the
 * performance and the capture use, so a law that reads a pose it resolved
 * itself (where a hand hangs, where a thigh lies) sees what is displayed.
 *
 * `AutoMovieMotionHumanBody.create` snapshots the canonical FK prerequisites
 * once. Every pose receives full ordered joint admission; a requested set
 * computes only its ancestor closure and returns only those reachable bones. A
 * supplied operation reader shares exact unchanged dependency work with fresh
 * outputs. The prepare companion binds this same body to a snapshot of
 * requested names once, then returns the same fresh map representation for
 * changing poses.
 * Parameter body: The body and its topology for the same, unchanged skeleton.
 * Parameter pose: The pose.
 * Parameter prepared: Optional exact FK reader owned and released by this
 * synchronous motion evaluation.
 * Parameter requested: Optional output bone set; omitted, all reachable bones are
 * returned in parent-first order.
 * Returns: Resolved bones by rig bone.
 */
export function poseBones(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return body.poseResolution.resolveMap(pose, prepared, requested);
}

/*
 * Bound canonical pose readers with fixed bone-name demand.
 */
export namespace poseBones {
  /*
   * Bind one body's fixed names for two-phase directly authored tuple FK. The
   * first call snapshots all entries, then all tuple F/A/T scalars before the
   * caller constructs its root or requests a lazy operation workspace. The
   * second call receives that original root carrier and admits every staged
   * scalar through genuine private FK, with fresh map/frames.
   *
   * Undefined tuples/components retain original read/finite failures. No proxy,
   * reused public joint, foreign callback or admission flag supplies values.
   * One packed 4J name/F/A/T array replaces J joint records, while the fixed
   * body/name factory retains no current tuple map, query, root or workspace.
   * Release each staged scan with its synchronous query; no source tuple,
   * output or history enters the factory and no task or handle is created.
   */
  export function prepareTuples(
    body: IAutoMovieMotionHumanBody,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): AutoMovieEngineSkeletonPose.ITupleReader {
    return body.poseResolution.prepareTuples(requested);
  }

  /*
   * A pose admitted once and handed on as a value (`IRig.read`): the pose's
   * producer makes one reading and every reader of that pose's bones takes them
   * from it, so the pose is admitted and each bone composed once however many
   * read it.
   * Parameter body: The body, unchanged while the reading is held.
   * Parameter pose: The pose, complete; its records are read now, in order.
   * Parameter prepared: Optional FK reader of the synchronous evaluation that
   * produced the pose, whose conversions the admission shares.
   * Returns: The reading; it holds the admitted values, so a later edit of the
   * pose does not reach it.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  ): AutoMovieEngineSkeletonPose.IReading {
    return body.poseResolution.read(pose, prepared);
  }

  /*
   * Bind one body's requested bone set once for readings (`read`) of changing
   * poses: each call returns that set's bones of one reading, fresh, without
   * sorting the names again.
   * Parameter body: The body.
   * Parameter requested: The names, copied now.
   * Returns: The bound reader of this body's readings.
   */
  export function prepareRead(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    reading: AutoMovieEngineSkeletonPose.IReading,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const demand: ReturnType<
      IAutoMovieMotionHumanBody["poseResolution"]["prepareBones"]
    > = body.poseResolution.prepareBones(requested);
    return (
      reading: AutoMovieEngineSkeletonPose.IReading,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      demand.read(reading);
  }

  /*
   * Prepare one body's requested bone set once for repeated complete poses.
   * Later edits to that set do not change the captured demand. Every query
   * still admits all current authored records and returns a fresh map/frames.
   *
   * The body's actual producer snapshots reachable names/order in O(K log K);
   * each query's ordinary sparse FK writes fresh map/frames directly, without
   * an intermediate FK array. Every current joint remains admitted and no
   * external index list, resolved flag, alternate body or target answer is
   * accepted. Optional same-operation readers share only exact current
   * dependencies. Release the bounded demand closure with its caller; no pose,
   * source set or query history is retained.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    pose: IAutoMoviePose,
    prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const demand: ReturnType<
      IAutoMovieMotionHumanBody["poseResolution"]["prepareBones"]
    > = body.poseResolution.prepareBones(requested);
    return (
      pose: IAutoMoviePose,
      prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      demand.map(pose, prepared);
  }
}
