import {
  preparePoseResolution,
  type prepareSkeletonPoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

/**
 * Every bone of a canonical pose placed in the world, by name: forward
 * kinematics with the canonical joint axes and rest frames, the reading the
 * performance and the capture use, so a law that reads a pose it resolved
 * itself (where a hand hangs, where a thigh lies) sees what is displayed.
 *
 * `createHumanBody` snapshots the canonical FK prerequisites once. Every pose
 * receives full ordered joint admission; a requested set computes only its
 * ancestor closure and returns only those reachable bones. A supplied
 * operation reader shares exact unchanged dependency work with fresh outputs.
 * The prepare companion binds this same body to a snapshot of requested names
 * once, then returns the same fresh map representation for changing poses.
 *
 * @param body The body and its topology for the same, unchanged skeleton.
 * @param pose The pose.
 * @param prepared Optional exact FK reader owned and released by this synchronous motion evaluation.
 * @param requested Optional output bone set; omitted, all reachable bones are returned in parent-first order.
 * @returns Resolved bones by rig bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines displayed canonical frames, unchanged body, live/fixed name demand and fresh ownership. prepareTuples defines entries/all-coordinate staging before root/supplier work and actual later ordered admission without intermediate records.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's prepared parent-first FK uses the canonical humanoid axes/rest-frame snapshot createHumanBody owns, retaining the ordinary quaternion grouping and every authored angle's admission while computing demanded ancestry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The genuine body rig owns prerequisites/dependencies and directly constructs fresh maps through the same FK recurrence/copy owner as array outputs. Ordinary and bound readers avoid a temporary FK array; prepareTuples delegates directly to the genuine rig's two-phase authored map reader, retaining one numerical admission owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Canonical axes/frames are unchanged, every query admits current authored records and no external numeric demand list, body override, resolved flag, pose or target answer bypasses the engine. No cast, tolerance or query-result cache is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Calls admit J joints; actual changes sort only after FK observation and revise affected observed descendants, with the engine tracking bounded first-demand insertion/sparse interval lookup. K names sort unless bound, then invalidated ancestry precedes K fresh map entries without a temporary frame array. prepare binds names once; omitted demand walks B indices directly. Fixed prerequisites/neutral rest compute lazily once per rig. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable body rig fixes rest/axes/frames/topology. prepare additionally snapshots actual name membership and binds the same body without retaining the source set. Optional operation identity scopes exact shared dynamic rows; current/removed joints and roots still invalidate actual dependencies independently of pose identity or demand order.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Maps/nested transforms are fresh caller-owned values. A prepared closure retains only its bounded name demand and body-rig reference until caller release; dynamic rows remain under weak operation keys and end with those readers. Neither path retains a pose, query-result history, handle or task.
 */
export function poseBones(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  prepared?: ReturnType<typeof preparePoseResolution>,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return body.poseResolution.resolveMap(pose, prepared, requested);
}

/**
 * Bound canonical pose readers with fixed bone-name demand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical-body binding and explicit fixed-demand preparation.
 * @evidence contracts/development/design.md#principled-representation The body owns one immutable rig; a prepared reader captures a name-set snapshot while querying complete changing poses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves repeated mass/bone reads; prepareTuples serves HumanTrunk's actual directly authored tuple reads with original staging/root/admission order. Neither exposes indices, packed arrays or a mutable demand token.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Body binding calls its genuine producer directly; no caller-provided resolved flag or foreign numerical demand is admitted.
 */
export namespace poseBones {
  /**
   * Bind one body's fixed names for two-phase directly authored tuple FK.
   * The first call snapshots all entries, then all tuple F/A/T scalars before
   * the caller constructs its root or requests a lazy operation workspace.
   * The second call receives that original root carrier and admits every
   * staged scalar through genuine private FK, with fresh map/frames.
   *
   * Undefined tuples/components retain original read/finite failures. No
   * proxy, reused public joint, foreign callback or admission flag supplies
   * values. One packed 4J name/F/A/T array replaces J joint records, while the fixed
   * body/name factory retains no current tuple map, query, root or workspace.
   * Release each staged scan with its synchronous query; no source tuple,
   * output or history enters the factory and no task or handle is created.
   */
  export function prepareTuples(
    body: IAutoMovieMotionHumanBody,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): prepareSkeletonPoseResolution.ITupleReader {
    return body.poseResolution.prepareTuples(requested);
  }

  /**
   * A pose admitted once and handed on as a value (`IRig.read`): the pose's
   * producer makes one reading and every reader of that pose's bones takes
   * them from it, so the pose is admitted and each bone composed once
   * however many read it.
   *
   * @param body The body, unchanged while the reading is held.
   * @param pose The pose, complete; its records are read now, in order.
   * @param prepared Optional FK reader of the synchronous evaluation that produced the pose, whose conversions the admission shares.
   * @returns The reading; it holds the admitted values, so a later edit of the pose does not reach it.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    prepared?: ReturnType<typeof preparePoseResolution>,
  ): prepareSkeletonPoseResolution.IReading {
    return body.poseResolution.read(pose, prepared);
  }

  /**
   * Bind one body's requested bone set once for readings (`read`) of
   * changing poses: each call returns that set's bones of one reading, fresh,
   * without sorting the names again.
   *
   * @param body The body.
   * @param requested The names, copied now.
   * @returns The bound reader of this body's readings.
   */
  export function prepareRead(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (reading: prepareSkeletonPoseResolution.IReading) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const demand: ReturnType<IAutoMovieMotionHumanBody["poseResolution"]["prepareBones"]> =
      body.poseResolution.prepareBones(requested);
    return (reading: prepareSkeletonPoseResolution.IReading): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      demand.read(reading);
  }

  /**
   * Prepare one body's requested bone set once for repeated complete poses.
   * Later edits to that set do not change the captured demand. Every query
   * still admits all current authored records and returns a fresh map/frames.
   *
   * The body's actual producer snapshots reachable names/order in O(K log K);
   * each query's ordinary sparse FK writes fresh map/frames directly, without
   * an intermediate FK array.
   * Every current joint remains admitted and no external index list, resolved
   * flag, alternate body or target answer is accepted. Optional same-operation
   * readers share only exact current dependencies. Release the bounded demand
   * closure with its caller; no pose, source set or query history is retained.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (pose: IAutoMoviePose, prepared?: ReturnType<typeof preparePoseResolution>) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const demand: ReturnType<IAutoMovieMotionHumanBody["poseResolution"]["prepareBones"]> =
      body.poseResolution.prepareBones(requested);
    return (pose: IAutoMoviePose, prepared?: ReturnType<typeof preparePoseResolution>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      demand.map(pose, prepared);
  }
}
