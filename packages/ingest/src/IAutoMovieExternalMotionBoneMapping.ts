import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One author-declared correspondence between an inspected node and a humanoid bone of the source rig.
 *
 * @evidence contracts/development/design.md#principled-representation A mapping row pairs an inspector-issued node id with a humanoid slot, so the correspondence is declared by the author against stable ids rather than inferred from node names.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One flat pair per mapped node is the minimum that lets both decisions and both handoffs share the same element type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The row carries no alias or fuzzy-match field; adoption refuses an unknown node, a bone the rig lacks, and any repeated node or bone.
 * @evidence contracts/development/common.md#meaningful-documentation The property comments give the node id form, that it must exist in the inspection, and that each bone and node maps at most once.
 */
export interface IAutoMovieExternalMotionBoneMapping {
  /** Inspected node id such as `node_3`; it must exist in the inspection. */
  node: string;

  /** Source-rig bone the node plays; each bone and node maps at most once. */
  bone: AutoMovieHumanoidBone;
}
