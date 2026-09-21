import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Bone name or sentinel used to index skeleton roots by parent.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Distinguishes declared parent bones from the hierarchy's null-parent roots.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Provides the key space for the skeleton's parent-child walk.
 */
export type AutoMovieSkeletonParentKey = AutoMovieHumanoidBone | "__root__";
