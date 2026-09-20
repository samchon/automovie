/**
 * Native external motion use without skeletal retargeting.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes native channel use an explicit production decision.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the native mode retained by the external motion receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNativeMode {
  /**
   * Native adoption discriminator.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Prevents silent substitution of retargeting for native use.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Records native channel preservation as the selected mode.
   */
  kind: "native";
}
