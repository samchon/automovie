import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Explicit imported-node to normalized source-bone correspondence.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Uses only an author-selected semantic mapping.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Records the selected mapping as an explicit adoption decision instead of inferring it from node names.
 * @author Samchon
 */
export interface IAutoMovieImportedNodeBoneMapping {
  /**
   * Exact imported node identity.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Identifies the source channel owner.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves the selected source element.
   */
  node: string;
  /**
   * Explicit normalized source-rig role.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Prevents name-similarity mapping.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Supplies the author-selected semantic correspondence consumed by retargeting.
   */
  bone: AutoMovieHumanoidBone;
}
