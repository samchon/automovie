import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { indexSkeletonTopologyChildren } from "./indexSkeletonTopologyChildren";
import { SKELETON_ROOT_PARENT } from "../SKELETON_ROOT_PARENT";

/*
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
 * Parameter skeleton: Rig to index; read, never modified.
 */
export function indexSkeletonTopology(
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeletonTopology {
  const childrenByParent: IAutoMovieSkeletonTopology["childrenByParent"] =
    indexSkeletonTopologyChildren(skeleton);
  const reachableBones: Set<AutoMovieHumanoidBone> = new Set();
  const walk: (bone: IAutoMovieBone) => void = (bone: IAutoMovieBone): void => {
    reachableBones.add(bone.bone);
    for (const child of childrenByParent.get(bone.bone) ?? []) walk(child);
  };
  for (const root of childrenByParent.get(SKELETON_ROOT_PARENT) ?? [])
    walk(root);

  return { childrenByParent, reachableBones };
}
