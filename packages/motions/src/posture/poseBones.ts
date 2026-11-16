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
  const resolved: IAutoMovieResolvedBone[] = body.poseResolution.resolve(
    pose, prepared, requested,
  );
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolved) map.set(bone.bone, bone);
  return map;
}
