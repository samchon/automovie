import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";
import { AutoMovieSkeletonParentKey } from "./AutoMovieSkeletonParentKey";
import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";

const ROOT_PARENT = "__root__";

/**
 * Index a skeleton's parent-child topology once for repeated FK work.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Builds the parent-first traversal required to compose rest transforms consistently.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Builds deterministic parent-first traversal metadata from declared hierarchy links.
 * @author Samchon
 */
export const indexSkeletonTopology = (
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeletonTopology => {
  const childrenByParent = new Map<
    AutoMovieSkeletonParentKey,
    IAutoMovieBone[]
  >();
  for (const bone of skeleton.bones) {
    const key = bone.parent ?? ROOT_PARENT;
    const children = childrenByParent.get(key) ?? [];
    children.push(bone);
    childrenByParent.set(key, children);
  }

  const reachableBones = new Set<AutoMovieHumanoidBone>();
  const walk = (bone: IAutoMovieBone): void => {
    reachableBones.add(bone.bone);
    for (const child of childrenByParent.get(bone.bone) ?? []) walk(child);
  };
  for (const root of childrenByParent.get(ROOT_PARENT) ?? []) walk(root);

  return { childrenByParent, reachableBones };
};
