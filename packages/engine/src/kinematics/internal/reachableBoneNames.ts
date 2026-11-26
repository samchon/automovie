import {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { indexSkeletonTopology } from "../indexSkeletonTopology";

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
 */
export const reachableBoneNames: (
  skeleton: IAutoMovieSkeleton,
  topology?: IAutoMovieSkeletonTopology,
) => Set<AutoMovieHumanoidBone> = (
  skeleton: IAutoMovieSkeleton,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
): Set<AutoMovieHumanoidBone> => new Set(topology.reachableBones);
