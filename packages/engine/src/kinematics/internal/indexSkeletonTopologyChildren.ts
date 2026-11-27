import {
  AutoMovieHumanoidBone,
  type AutoMovieSkeletonParentKey,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { SKELETON_ROOT_PARENT } from "../constants/SKELETON_ROOT_PARENT";

/** Group declared bones by parent. Reject duplicate names before traversal. */
export function indexSkeletonTopologyChildren(
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
