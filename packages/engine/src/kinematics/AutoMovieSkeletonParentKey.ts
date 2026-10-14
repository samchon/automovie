import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Key of {@link IAutoMovieSkeletonTopology.childrenByParent}: a parent bone's
 * name, or `"__root__"` for the bones whose `parent` is `null`.
 *
 * The sentinel cannot collide with a bone because `AutoMovieHumanoidBone` is a
 * closed union of camel-case names.
 *
 * @evidence contracts/common.md#principled-implementation A tagged sentinel beside the closed bone-name union lets one `Map` key both roots and children, and the union's closedness is the premise that keeps the sentinel distinct from every real bone.
 * @evidence contracts/common.md#clear-and-simple-design Names the key type once so `indexSkeletonTopology` and the topology record agree, instead of a `null` key that would need a separate root list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sentinel is a declared member of the type, not an untyped string cast into the bone union.
 * @evidence contracts/common.md#meaningful-documentation States what each member keys, which map uses it, and why the sentinel cannot collide.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias with no runtime body.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A compile-time key type; the topology map that uses it is built and reused by its own owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type alias holds nothing at runtime.
 * @author Samchon
 */
export type AutoMovieSkeletonParentKey = AutoMovieHumanoidBone | "__root__";
