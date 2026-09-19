import { AutoMovieHumanoidBone, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "./indexSkeletonTopology";

/**
 * The bones a skeleton's forward-kinematics walk actually reaches, every bone
 * whose parent chain lands on a null-parent root. Pose-independent (it follows
 * parent links only), so it is the exact set {@link resolvePose}'s walk visits
 * and can never disagree with which bones a sampled pose resolves. A physics
 * validator gates a bone against this set BEFORE reading its resolved world
 * position: a bone can be **declared** in `skeleton.bones` yet be detached (its
 * chain never reaches a root), in which case `resolvePose` omits it and the
 * declared-set membership check alone would read a bone the FK result never
 * contains. This is the query that names the reachable set explicitly.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-refusal Returns the bones connected to a declared root before consumers read FK output.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-retarget-preservation-failure Returns the exact connected topology used to diagnose an unusable rig chain.
 * @author Samchon
 */
export const reachableBoneNames = (
  skeleton: IAutoMovieSkeleton,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
): Set<AutoMovieHumanoidBone> => new Set(topology.reachableBones);
