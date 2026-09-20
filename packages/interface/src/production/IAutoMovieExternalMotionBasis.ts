import { IAutoMovieExternalMotionBasisNode } from "./IAutoMovieExternalMotionBasisNode";

/**
 * Canonical byte-grounded coordinate and hierarchy basis for external motion.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Requires units, axes, handedness, hierarchy, and rest basis to be inspected before selection.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the normalized source basis sealed into the adoption receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionBasis {
  /**
   * Versioned canonical basis profile.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Makes basis interpretation explicit and versioned.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Identifies the deterministic normalization protocol used by the receipt.
   */
  profile: "gltf-motion-basis-v1";

  /**
   * Canonical length unit of normalized translations.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Declares the source motion unit instead of inferring scale downstream.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Seals meter normalization into the source basis.
   */
  lengthUnit: "meter";

  /**
   * Canonical coordinate handedness.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Declares coordinate handedness before mapping or retargeting.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Seals right-handed interpretation into the source basis.
   */
  handedness: "right-handed";

  /**
   * Canonical vertical axis.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Declares the source up axis before channel interpretation.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Seals Y-up normalization into the source basis.
   */
  upAxis: "Y-up";

  /**
   * Inspected nodes in stable source index order.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes the complete source hierarchy and local rest basis.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Carries byte-grounded nodes into compatibility, mapping, and result receipts.
   */
  nodes: IAutoMovieExternalMotionBasisNode[];
}
