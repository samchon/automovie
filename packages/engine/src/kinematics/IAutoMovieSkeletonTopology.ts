import { AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";
import { AutoMovieSkeletonParentKey } from "./AutoMovieSkeletonParentKey";

/**
 * Pose-independent hierarchy index for a skeleton's FK walk.
 *
 * Build this once when resolving many poses against the same skeleton, then
 * pass it into {@link resolvePose} and {@link reachableBoneNames}. The default
 * call path intentionally rebuilds the index from the current skeleton object,
 * so callers that mutate `skeleton.bones` never get a hidden stale cache.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Indexes the stable hierarchy used to compose every bone from its parent-local rest transform.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Holds the reusable traversal state derived from a skeleton.
 * @author Samchon
 */
export interface IAutoMovieSkeletonTopology {
  /**
   * Bones grouped by parent (`__root__` for null-parent roots).
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Retains each parent-local relationship used by forward kinematics.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Supplies a deterministic child order for the hierarchy walk.
   */
  readonly childrenByParent: ReadonlyMap<
    AutoMovieSkeletonParentKey,
    readonly IAutoMovieBone[]
  >;

  /**
   * The exact bone names the FK root walk can reach.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-refusal Marks exactly the declared bones connected to a hierarchy root.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-retarget-preservation-failure Exposes the reachable set used to report malformed rig topology.
   */
  readonly reachableBones: ReadonlySet<AutoMovieHumanoidBone>;
}
