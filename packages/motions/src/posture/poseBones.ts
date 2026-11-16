import {
  type IAutoMovieResolvedBone,
  type preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

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
 *
 * @param body The body and its topology for the same, unchanged skeleton.
 * @param pose The pose.
 * @param prepared Optional exact FK reader owned and released by this synchronous motion evaluation.
 * @param requested Optional output bone set; omitted, all reachable bones are returned in parent-first order.
 * @returns Resolved bones by rig bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the displayed reading, canonical mappings and the body's unchanged-skeleton topology premise.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's prepared parent-first FK uses the canonical humanoid axes/rest-frame snapshot createHumanBody owns, retaining the ordinary quaternion grouping and every authored angle's admission while computing demanded ancestry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The body's prepareSkeletonPoseResolution result owns static prerequisites and dependency updates; this adapter only indexes its fresh requested outputs by bone.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cast, assertion or tolerance; the axes and rest frames are the engine's canonical tables.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every authored record remains O(J); K requested indices are sorted and their D ancestors visited before K fresh map entries are inserted. Omitted demand visits all B bones. Static rig admission is paid once, unchanged dependency math is shared only within a supplied operation, and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body's immutable canonical rig snapshot fixes rest/axes/frames/topology. An optional operation reader keys private exact clinical/ancestor/root dependency rows; changing or removed joints and root edits invalidate affected frames independently of pose identity or demand order.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a fresh map and nested bone transforms; a borrowed resolution reader keeps its private snapshots only until the synchronous motion evaluation releases it. This adapter stores no global state or handle.
 */
export function poseBones(
  body: IHumanBody,
  pose: IAutoMoviePose,
  prepared?: ReturnType<typeof preparePoseResolution>,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return byName(body.poseResolution.resolve(pose, prepared, requested));
}

/**
 * Bound canonical pose readers with fixed bone-name demand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical-body binding and explicit fixed-demand preparation.
 * @evidence contracts/development/design.md#principled-representation The body owns one immutable rig; a prepared reader captures a name-set snapshot while querying complete changing poses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepare companion serves mass-model repeated reads without exposing engine indices or a mutable demand token.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Body binding calls its genuine producer directly; no caller-provided resolved flag or foreign numerical demand is admitted.
 */
export namespace poseBones {
  /**
   * Prepare one body's requested bone set once for repeated complete poses.
   * Later edits to that set do not change the captured demand. Every query
   * still admits all current authored records and returns a fresh map/frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines captured membership, fixed body, complete pose admission and fresh map/transform ownership.
   * @evidence contracts/development/implementation.md#principled-implementation The body's actual immutable rig snapshots reachable names/order, then resolves each current pose through its ordinary exact parent-first FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates fixed-demand preparation to the engine producer and indexes fresh outputs through the same local adapter as ordinary poseBones.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No external index list, pose, target, admission flag or body override enters the returned reader; all authored query joints remain admitted.
   * @evidence contracts/development/implementation.md#efficient-algorithms K-name lookup/sorting is paid once. Each query admits J current joints, checks D demanded ancestors and creates K fresh map entries without rebuilding demand; runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The captured body rig and copied name membership establish static equivalence; optional operation-reader identity scopes exact dynamic reuse, while current pose scalars still invalidate changed dependencies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns one bounded demand snapshot and borrows the body rig until caller release. Dynamic rows use weak operation keys; no pose, result history, handle or task is retained.
   */
  export function prepare(
    body: IHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (pose: IAutoMoviePose, prepared?: ReturnType<typeof preparePoseResolution>) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const demand: ReturnType<IHumanBody["poseResolution"]["prepareBones"]> =
      body.poseResolution.prepareBones(requested);
    return (pose: IAutoMoviePose, prepared?: ReturnType<typeof preparePoseResolution>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      byName(demand.resolve(pose, prepared));
  }
}

/** Index only actual fresh FK outputs; neither this map nor its frames are retained. */
function byName(resolved: readonly IAutoMovieResolvedBone[]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolved) map.set(bone.bone, bone);
  return map;
}
