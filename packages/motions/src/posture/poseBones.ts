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
 * The prepare companion binds this same body to a snapshot of requested names
 * once, then returns the same fresh map representation for changing poses.
 *
 * @param body The body and its topology for the same, unchanged skeleton.
 * @param pose The pose.
 * @param prepared Optional exact FK reader owned and released by this synchronous motion evaluation.
 * @param requested Optional output bone set; omitted, all reachable bones are returned in parent-first order.
 * @returns Resolved bones by rig bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States displayed canonical frames, unchanged body inputs, ordinary live versus prepared fixed name demand, complete pose admission and fresh map/transform ownership; the prepare companion's plain docs give bound-reader scope and release.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's prepared parent-first FK uses the canonical humanoid axes/rest-frame snapshot createHumanBody owns, retaining the ordinary quaternion grouping and every authored angle's admission while computing demanded ancestry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The body's genuine prepareSkeletonPoseResolution result owns static prerequisites/dependency updates. Ordinary reads and the prepare companion both index fresh engine outputs through byName; prepare delegates actual fixed-name preparation to that same producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Canonical axes/frames are unchanged, every query admits current authored records and no external numeric demand list, body override, resolved flag, pose or target answer bypasses the engine. No cast, tolerance or query-result cache is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary calls admit J joints, sort actual final changes and revise affected descendant intervals once, then sort K requested names, check only invalidated demanded ancestry and insert K fresh map entries. prepare pays name lookup/sorting once, preserving current admission/dependency work; omitted demand returns B bones. Actual fixed prerequisites and neutral rest computations prepare lazily once per rig. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable body rig fixes rest/axes/frames/topology. prepare additionally snapshots actual name membership and binds the same body without retaining the source set. Optional operation identity scopes exact shared dynamic rows; current/removed joints and roots still invalidate actual dependencies independently of pose identity or demand order.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Maps/nested transforms are fresh caller-owned values. A prepared closure retains only its bounded name demand and body-rig reference until caller release; dynamic rows remain under weak operation keys and end with those readers. Neither path retains a pose, query-result history, handle or task.
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
   * The body's actual producer snapshots reachable names/order in O(K log K);
   * byName indexes each query's ordinary sparse FK into fresh map/frames.
   * Every current joint remains admitted and no external index list, resolved
   * flag, alternate body or target answer is accepted. Optional same-operation
   * readers share only exact current dependencies. Release the bounded demand
   * closure with its caller; no pose, source set or query history is retained.
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
