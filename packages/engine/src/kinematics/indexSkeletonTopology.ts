import {
  AutoMovieHumanoidBone,
  type AutoMovieSkeletonParentKey,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
} from "@automovie/interface";

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
 * caller that later changes `skeleton.bones` must build a new one. Duplicate
 * bone names throw before traversal because one identity cannot own two parent
 * links or two rest transforms.
 *
 * @param skeleton Rig to index; read, never modified.
 */
export function indexSkeletonTopology(
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeletonTopology {
  const childrenByParent: IAutoMovieSkeletonTopology["childrenByParent"] =
    indexSkeletonTopology.children(skeleton);
  const reachableBones: Set<AutoMovieHumanoidBone> = new Set();
  const walk: (bone: IAutoMovieBone) => void = (bone: IAutoMovieBone): void => {
    reachableBones.add(bone.bone);
    for (const child of childrenByParent.get(bone.bone) ?? []) walk(child);
  };
  for (const root of childrenByParent.get(SKELETON_ROOT_PARENT) ?? [])
    walk(root);

  return { childrenByParent, reachableBones };
}

/** Parent-child indexing for readers that perform their own root traversal. */
export namespace indexSkeletonTopology {
  /** Group declared bones by parent. Reject duplicate names before traversal. */
  export function children(
    skeleton: IAutoMovieSkeleton,
  ): IAutoMovieSkeletonTopology["childrenByParent"] {
    const childrenByParent: Map<AutoMovieSkeletonParentKey, IAutoMovieBone[]> =
      new Map();
    const names: Set<AutoMovieHumanoidBone> = new Set();
    for (const bone of skeleton.bones) {
      if (names.has(bone.bone))
        throw new Error(`Skeleton topology has duplicate bone "${bone.bone}".`);
      names.add(bone.bone);
      const key: AutoMovieSkeletonParentKey =
        bone.parent ?? SKELETON_ROOT_PARENT;
      const children: IAutoMovieBone[] = childrenByParent.get(key) ?? [];
      children.push(bone);
      childrenByParent.set(key, children);
    }
    return childrenByParent;
  }
}
