import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBone } from "../skeleton/IAutoMovieBone";
import type { AutoMovieSkeletonParentKey } from "./AutoMovieSkeletonParentKey";

/**
 * Pose-independent hierarchy index for a skeleton's forward-kinematics walk.
 *
 * `indexSkeletonTopology` builds it. Build it once when resolving many poses
 * against the same skeleton, then pass it into {@link resolvePose} and
 * {@link reachableBoneNames}. The index holds the skeleton's own bone objects
 * and is not updated when the skeleton changes, so the default call path
 * rebuilds it from the current skeleton object and a caller that mutates
 * `skeleton.bones` must rebuild it too.
 */
export interface IAutoMovieSkeletonTopology {
  /**
   * The skeleton's bones grouped by parent name, `"__root__"` for null-parent
   * roots, in declaration order.
   */
  readonly childrenByParent: ReadonlyMap<
    AutoMovieSkeletonParentKey,
    readonly IAutoMovieBone[]
  >;

  /** The exact bone names the walk from the roots reaches. */
  readonly reachableBones: ReadonlySet<AutoMovieHumanoidBone>;
}
