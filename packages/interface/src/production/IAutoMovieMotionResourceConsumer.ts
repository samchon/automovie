/**
 * Sidecar bytes owned by one manifest-declared external motion asset.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Keeps every dependency byte in the external motion source closure.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the sidecar-to-source ownership needed by the non-destructive adoption receipt.
 * @author Samchon
 */
export interface IAutoMovieMotionResourceConsumer {
  /**
   * External motion sidecar consumer discriminator.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Distinguishes dependency closure from the adoption that later consumes it.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Identifies this use as source-resource ownership in the adoption receipt.
   */
  kind: "motion-resource";

  /**
   * Exact manifest path of the owning external motion asset.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Binds the sidecar to the preserved source asset identity.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Joins this dependency byte to the source digest closure.
   */
  id: string;
}
