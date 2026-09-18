/**
 * Explicit humanoid retargeting of external motion.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes retargeting and its scale an explicit production decision.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the retarget mode retained by the external motion receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionHumanoidRetargetMode {
  /**
   * Humanoid-retarget adoption discriminator.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Prevents silent substitution of native use for retargeting.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Records humanoid retargeting as the selected mode.
   */
  kind: "humanoid-retarget";

  /**
   * Explicit finite positive root-translation scale.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Makes automatic scale correction reviewable and overridable.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Retains the selected translation conversion in the receipt.
   */
  translationScale: number;
}
