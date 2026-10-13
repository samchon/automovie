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
 * @author Samchon
 */
export interface IAutoMovieSkeletonTopology {
  /** Bones grouped by parent (`__root__` for null-parent roots). */
  readonly childrenByParent: ReadonlyMap<
    AutoMovieSkeletonParentKey,
    readonly IAutoMovieBone[]
  >;

  /** The exact bone names the FK root walk can reach. */
  readonly reachableBones: ReadonlySet<AutoMovieHumanoidBone>;
}
