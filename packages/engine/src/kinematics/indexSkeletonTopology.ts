import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { AutoMovieSkeletonParentKey } from "./AutoMovieSkeletonParentKey";
import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";

/**
 * Index a skeleton's parent-child topology once, for forward-kinematics work
 * repeated over many poses of the same skeleton.
 *
 * `childrenByParent` lists each bone under its parent, in declaration order,
 * with null-parent roots under `SKELETON_ROOT_PARENT`. `reachableBones` holds
 * every bone whose parent chain ends at such a root: a bone whose parent is
 * undeclared, or whose chain is a cycle, is never entered from a root and is
 * absent. The index is a snapshot; it holds the skeleton's bone objects, so a
 * caller that later changes `skeleton.bones` must build a new one.
 * Duplicate bone names throw before traversal because one identity cannot own
 * two parent links or two rest transforms.
 *
 * @param skeleton Rig to index; read, never modified.
 *
 * @evidence contracts/common.md#principled-implementation An adjacency list keyed by parent followed by a depth-first root walk; unique names are checked before grouping, so each bone has one parent and a cycle has no root from which it could recurse. The reachable set therefore matches the forward-kinematics traversal without ambiguous repeated identities.
 * @evidence contracts/common.md#clear-and-simple-design Builds the pose-independent part of forward kinematics once so `resolvePose` and `reachableBoneNames` share it; the root sentinel comes from the shared `SKELETON_ROOT_PARENT` both read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every bone is filed by its declared parent alone; an orphan or cycle is left unreachable rather than reattached or rejected, and no bone name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what each map holds and in which order, the root key, which bones are unreachable and why, and that the index is a snapshot the caller rebuilds after changing the skeleton.
 * @evidence contracts/performance.md#efficient-algorithms One pass to group the bones and one walk over the reachable ones, linear in the bone count in time and space; the walk recurses to the skeleton's depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Produces the reusable index itself: callers pass it to `resolvePose` and `reachableBoneNames` across poses, and equivalence is the unchanged skeleton object, which the snapshot note makes the caller's responsibility.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned index is owned by the caller and holds one entry per bone plus one set entry per reachable bone, bounded by the skeleton's bone count; nothing is retained here.
 * @author Samchon
 */
export const indexSkeletonTopology: (
  skeleton: IAutoMovieSkeleton,
) => IAutoMovieSkeletonTopology = (
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeletonTopology => {
  const childrenByParent: Map<AutoMovieSkeletonParentKey, IAutoMovieBone[]> =
    new Map();
  const names: Set<AutoMovieHumanoidBone> = new Set();
  for (const bone of skeleton.bones) {
    if (names.has(bone.bone))
      throw new Error(`Skeleton topology has duplicate bone "${bone.bone}".`);
    names.add(bone.bone);
    const key: AutoMovieSkeletonParentKey = bone.parent ?? SKELETON_ROOT_PARENT;
    const children: IAutoMovieBone[] = childrenByParent.get(key) ?? [];
    children.push(bone);
    childrenByParent.set(key, children);
  }

  const reachableBones: Set<AutoMovieHumanoidBone> = new Set();
  const walk: (bone: IAutoMovieBone) => void = (bone: IAutoMovieBone): void => {
    reachableBones.add(bone.bone);
    for (const child of childrenByParent.get(bone.bone) ?? []) walk(child);
  };
  for (const root of childrenByParent.get(SKELETON_ROOT_PARENT) ?? [])
    walk(root);

  return { childrenByParent, reachableBones };
};
