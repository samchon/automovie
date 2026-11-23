import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Key of {@link IAutoMovieSkeletonTopology.childrenByParent}: a parent bone's
 * name, or `"__root__"` for the bones whose `parent` is `null`.
 *
 * The sentinel cannot collide with a bone because `AutoMovieHumanoidBone` is a
 * closed union of camel-case names.
 */
export type AutoMovieSkeletonParentKey = AutoMovieHumanoidBone | "__root__";
