import { IAutoMovieMotion, IAutoMovieValidation } from "@automovie/interface";
import { IAutoMovieHumanoidRetargetCharacterization } from "./IAutoMovieHumanoidRetargetCharacterization";

/**
 * Result of retargeting. `motion` and `characterization` are present only when
 * every structural, scale, and target-ROM check passed.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-refusal Separates validation findings from nullable artifacts so an invalid conversion cannot masquerade as motion.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Gates both returned artifacts on the conversion's validated success.
 * @author Samchon
 */
export interface IAutoMovieHumanoidRetargetResult {
  /**
   * Validation envelope containing field-located failures.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-refusal Reports field-located causes when the target conversion cannot be accepted.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Carries the conversion verdict and its field-located findings.
   */
  validation: IAutoMovieValidation;

  /**
   * Retargeted clip, or `null` when validation failed.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-refusal Withholds target motion whenever conversion validation fails.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Carries the usable target performance produced by the accepted conversion.
   */
  motion: IAutoMovieMotion | null;

  /**
   * The rig characterization required to play the clip on the target.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Preserves the resolved playback basis beside the converted clip.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Carries the playback basis that reproduces the accepted target conversion.
   */
  characterization: IAutoMovieHumanoidRetargetCharacterization | null;
}
