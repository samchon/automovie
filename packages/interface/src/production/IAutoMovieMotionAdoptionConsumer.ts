/**
 * Explicit production adoption that consumes one external motion source.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Keeps source selection and adoption mode under production authority.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the source-to-adoption consumer edge recorded by the receipt.
 * @author Samchon
 */
export interface IAutoMovieMotionAdoptionConsumer {
  /**
   * External motion adoption consumer discriminator.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Distinguishes a chosen adoption from passive source-resource ownership.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Identifies this use as a production adoption decision.
   */
  kind: "motion-adoption";

  /**
   * Exact production-declared adoption identity.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Binds source use to the user's explicit adoption decision.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Joins the source bytes to the selected adoption receipt.
   */
  id: string;
}
