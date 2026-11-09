import { AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";

import { AutoMovieSkeletonParentKey } from "./AutoMovieSkeletonParentKey";

/**
 * Pose-independent hierarchy index for a skeleton's forward-kinematics walk.
 *
 * `indexSkeletonTopology` builds it. Build it once when resolving many poses
 * against the same skeleton, then pass it into {@link resolvePose} and
 * {@link reachableBoneNames}. The index holds the skeleton's own bone objects
 * and is not updated when the skeleton changes, so the default call path
 * rebuilds it from the current skeleton object and a caller that mutates
 * `skeleton.bones` must rebuild it too.
 *
 * @evidence contracts/development/design.md#principled-representation A parent-to-children adjacency list plus the set reached by a depth-first walk from the null-parent roots, which is exactly the order and population the forward-kinematics walk needs; bones on a cycle or under a missing parent are never reached.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both facts every walk needs, children and reachability, in one readonly record that `resolvePose`, `reachableBoneNames` and the validators accept as an optional argument.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cache is hidden behind the skeleton object; reuse is an explicit argument, so a mutated skeleton cannot be resolved against a stale index unless the caller passes one.
 * @evidence contracts/development/common.md#meaningful-documentation States its builder and consumers, when to reuse it, that it aliases the skeleton's bones and goes stale on mutation, and what each member keys or contains.
 */
export interface IAutoMovieSkeletonTopology {
  /** The skeleton's bones grouped by parent name, `"__root__"` for null-parent roots, in declaration order. */
  readonly childrenByParent: ReadonlyMap<
    AutoMovieSkeletonParentKey,
    readonly IAutoMovieBone[]
  >;

  /** The exact bone names the walk from the roots reaches. */
  readonly reachableBones: ReadonlySet<AutoMovieHumanoidBone>;
}
