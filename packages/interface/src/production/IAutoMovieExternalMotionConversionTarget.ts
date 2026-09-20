import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Target basis against which one external motion conversion was decided.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires compatibility to be evaluated against the chosen target controls and scale.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the target identity and basis sealed by the receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionTarget {
  /**
   * Target production model identity.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires compatibility findings to name the selected target.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Binds conversion to the exact target model.
   */
  model: string;

  /**
   * Target skeleton identity within the model.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires source and target control coverage to be compared explicitly.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Binds mapping and retargeting to the exact target skeleton.
   */
  skeleton: string;

  /**
   * Canonical digest of the target skeleton basis.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires meaningful target interpretation changes to invalidate the receipt.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Makes the target basis a pinned conversion input.
   */
  basisDigest: AutoMovieContentDigest;
}
