import {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "./indexSkeletonTopology";

/**
 * The bones a skeleton's forward-kinematics walk reaches: every bone whose
 * parent chain ends at a null-parent root.
 *
 * The set depends on parent links only, so it is exactly the set of bones
 * {@link resolvePose} returns for any pose. A bone can be declared in
 * `skeleton.bones` yet be detached, with an undeclared parent or a cyclic
 * chain, and then `resolvePose` omits it; a validator gates on this set before
 * reading a bone's resolved position so such a rig is reported instead of
 * crashing the lookup.
 *
 * @param skeleton Rig whose reachable bones are listed.
 * @param topology Index of the same, unchanged skeleton from
 *   {@link indexSkeletonTopology}; omitted, one is built for this call.
 * @returns A new set the caller may modify without affecting `topology`.
 *
 * @evidence contracts/common.md#principled-implementation Reads the reachable set the topology's root walk already computed, the same walk `resolvePose` performs, so the two cannot disagree; it premises that a passed topology was built from this unchanged skeleton.
 * @evidence contracts/common.md#clear-and-simple-design A named query over the shared topology index, used by retarget contact preservation and, through `fkReachableBones`, the physics validators, so none of them walks the hierarchy itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Detached bones are left out rather than reattached or rejected, and no bone or rig is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what reachable means, that it matches `resolvePose` for every pose, why validators gate on it, the topology premise and default, and that the returned set is the caller's own copy.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the bone count: building the index when none is passed, then copying the reachable set so the caller's set cannot alias the shared index.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses a caller-supplied topology across calls for the same skeleton instead of rebuilding it; equivalence is the unchanged skeleton object, which the caller owns, and omitting the topology always rebuilds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned set, at most one entry per bone.
 */
export const reachableBoneNames: (
  skeleton: IAutoMovieSkeleton,
  topology?: IAutoMovieSkeletonTopology,
) => Set<AutoMovieHumanoidBone> = (
  skeleton: IAutoMovieSkeleton,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
): Set<AutoMovieHumanoidBone> => new Set(topology.reachableBones);
