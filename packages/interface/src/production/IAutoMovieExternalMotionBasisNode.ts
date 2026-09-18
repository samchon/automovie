import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One node basis inspected directly from external motion source bytes.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Requires source hierarchy and rest transforms before an adoption decision.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the byte-grounded node facts retained by the external motion receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionBasisNode {
  /**
   * Zero-based node index in the inspected glTF scene.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Addresses the exact source node without display-name inference.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves the source container address in the receipt basis.
   */
  nodeIndex: number;
  /**
   * Stable normalized node identity used by motion channels and parent links.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Gives each source skeleton member a stable identity.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Carries the normalized source node identity into mapping and compatibility checks.
   */
  id: string;
  /**
   * Source-authored node name, or null when the node is unnamed.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes source metadata without treating name similarity as mapping authority.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Retains the observed label separately from stable node identity.
   */
  sourceName: string | null;
  /**
   * Parent normalized node identity, or null for a source root.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Records the inspected source skeleton hierarchy.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Binds each source node to its byte-grounded parent relation.
   */
  parent: string | null;
  /**
   * Normalized parent-local rest transform inspected from the source node.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Records the rest basis used to interpret source animation channels.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Carries the normalized local rest transform into compatibility and retarget receipts.
   */
  localRest: IAutoMovieTransform;
}
