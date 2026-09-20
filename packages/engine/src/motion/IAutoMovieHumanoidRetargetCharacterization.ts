import { AutoMovieHumanoidBone } from "@automovie/interface";
import { AutoMovieRetargetContactPolicy } from "./AutoMovieRetargetContactPolicy";
import { AutoMovieRetargetFacing } from "./AutoMovieRetargetFacing";
import { AutoMovieRetargetRomPolicy } from "./AutoMovieRetargetRomPolicy";
import { IAutoMovieHumanoidRigCharacterization } from "./IAutoMovieHumanoidRigCharacterization";

/**
 * The source-target decision record for a retargeted humanoid clip.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Records the resolved basis of one completed retarget.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Makes the effective retarget policy reproducible at playback.
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-motion-retargeting Records the source and target characterizations, root scale, facing, ROM, contact policy, and required mappings used by the conversion.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-external-adoption-retarget-characterization Preserves the exact source-to-target characterization beside the retargeted result.
 * @author Samchon
 */
export interface IAutoMovieHumanoidRetargetCharacterization {
  /**
   * Source rig the clip was authored against.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Preserves the rig basis in which the authored clip has meaning.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Defines the rig-space in which source motion is measured.
   */
  source: IAutoMovieHumanoidRigCharacterization;

  /**
   * Target rig the clip now plays on.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Identifies the selected destination and its semantic mapping.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Defines the rig-space in which the converted motion must play.
   */
  target: IAutoMovieHumanoidRigCharacterization;

  /**
   * Root translation multiplier (`target.height / source.height` by default).
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-proportion Records the concrete root-motion correction for the rigs' size difference.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Applies the same scale to root travel and mapped contact positions.
   */
  rootScale: number;

  /**
   * Root facing convention: v1 preserves authored root rotations.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Records the selected rule for interpreting source root orientation.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Confirms that target conversion preserves the authored facing.
   */
  facing: AutoMovieRetargetFacing;

  /**
   * Effective ROM priority for the target validation pass.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-refusal Records which range authority determines whether target playback is legal.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Exposes the ROM policy enforced after contact correction.
   */
  romPolicy: AutoMovieRetargetRomPolicy;

  /**
   * Whether source contacts were re-pinned on the target rig.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Records whether target contact was solved or source angles were carried unchanged.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Identifies the contact treatment that produced the returned clip.
   */
  contactPolicy: AutoMovieRetargetContactPolicy;

  /**
   * Bones that had to exist in both rigs for this retarget operation.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Lists the semantic correspondences required by this specific conversion.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Makes an incomplete semantic correspondence diagnosable before conversion.
   */
  requiredBones: AutoMovieHumanoidBone[];
}
