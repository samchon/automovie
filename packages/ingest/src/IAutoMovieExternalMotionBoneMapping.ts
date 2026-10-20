import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One author-declared correspondence between an inspected node and a humanoid bone of the source rig.
 *
 * @evidence contracts/common.md#principled-implementation A mapping row pairs an inspector-issued node id with a humanoid slot, so the correspondence is declared by the author against stable ids rather than inferred from node names.
 * @evidence contracts/common.md#clear-and-simple-design One flat pair per mapped node is the minimum that lets both decisions and both handoffs share the same element type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The row carries no alias or fuzzy-match field; adoption refuses an unknown node, a bone the rig lacks, and any repeated node or bone.
 * @evidence contracts/common.md#meaningful-documentation The property comments give the node id form, that it must exist in the inspection, and that each bone and node maps at most once.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A two-field row type declares data and runs no code of its own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The row is plain data with no work behind it to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each row is two strings held by its decision or handoff array and owns nothing else.
 */
export interface IAutoMovieExternalMotionBoneMapping {
  /** Inspected node id such as `node_3`; it must exist in the inspection. */
  node: string;

  /** Source-rig bone the node plays; each bone and node maps at most once. */
  bone: AutoMovieHumanoidBone;
}
