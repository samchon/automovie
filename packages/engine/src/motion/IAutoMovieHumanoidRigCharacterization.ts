import { AutoMovieHumanoidBone } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * A normalized humanoid rig characterized for motion retargeting: the semantic
 * bone slots, the concrete node ids the host should address, and the
 * rest-frame/axis tables needed to read clinical angles on that rig.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Preserves the concrete rig basis used to interpret clinical joint angles.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Supplies the normalized characterization required for a reproducible rig conversion.
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-humanoid-mapping Records the explicit semantic humanoid-slot to concrete-node correspondence instead of relying on name similarity.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping Carries the concrete node, clinical-axis, and rest-frame basis for each mapped humanoid role.
 * @author Samchon
 */
export interface IAutoMovieHumanoidRigCharacterization {
  /**
   * Skeleton id the characterization was derived from.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Identifies the exact rig whose measurements and mappings were used.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Binds each characterization record to the skeleton it describes.
   */
  skeleton: string;

  /**
   * Humanoid slot -> concrete target node id.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Records the chosen semantic correspondence instead of inferring it during playback.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Maps clinical humanoid channels onto the concrete rig nodes being converted.
   */
  boneMap: Partial<Record<AutoMovieHumanoidBone, string>>;

  /**
   * Rest-pose vertical extent in model units, used for root-motion scale.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-proportion Measures the rig proportion used to scale authored root displacement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Supplies the rest-pose extent used in the root-scale ratio.
   */
  height: number;

  /**
   * Clinical-axis remap to pass to `resolvePose` / viewer playback.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Preserves how each semantic joint axis maps into the concrete rig basis.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Lets the converted clinical angles resolve consistently on the target rig.
   */
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Clinical rest-frame remap to pass to `resolvePose` / viewer playback.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Retains the declared rest basis against which clinical motion is interpreted.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Keeps target playback in the same characterization used by the conversion.
   */
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
