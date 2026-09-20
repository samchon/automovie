import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit source-node to target-semantic-bone mapping entry.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Makes automatic or authored mapping inspectable and overridable.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the mapping decision retained by external motion adoption receipts.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionMappingEntry {
  /**
   * Stable source node identity from the inspected byte basis.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Identifies the exact source node participating in the reviewed mapping.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Joins one byte-grounded source node to the retained mapping decision.
   */
  source: string;

  /**
   * Target normalized humanoid bone.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Exposes the selected target control for user review or override.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Records the semantic target selected for the source node.
   */
  target: AutoMovieHumanoidBone;
}
