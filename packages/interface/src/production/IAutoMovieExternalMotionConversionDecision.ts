import type { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import type { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * Actor-bound production decision that authorizes one motion conversion.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Keeps source use, target binding, mapping, and adoption mode explicit.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the authored decision retained by the external motion receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionDecision {
  /**
   * Production shot that owns the adopted motion.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Keeps external motion adoption attached to the authored performance context.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Records the shot-scoped destination of the conversion.
   */
  shot: string;

  /**
   * Actor identity that consumes the converted motion.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes the target performer part of the explicit adoption decision.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Binds the conversion result to one actor rather than an unowned clip.
   */
  actor: string;

  /**
   * Authored clip identity receiving the converted motion.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Keeps the selected adoption destination explicit.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Joins the result to the exact performance clip.
   */
  clip: string;

  /**
   * Native or humanoid-retarget conversion mode.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Prevents the builder from silently changing the selected adoption technique.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Retains the selected mode as receipt data.
   */
  mode: IAutoMovieExternalMotionAdoptionMode["kind"];

  /**
   * Reviewed source-node to target-bone mapping.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires automatic mapping to remain inspectable and overridable.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Seals the accepted mapping separately from compatibility findings.
   */
  mapping: IAutoMovieExternalMotionMappingEntry[];

  /**
   * Explicit root-translation scale, or null for native adoption.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Makes automatic scale correction reviewable and overridable.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Records the chosen translation conversion without inferring it later.
   */
  translationScale: number | null;
}
