import { AutoMovieHumanoidBone, IAutoMovieMotion, IAutoMovieProfileBinding, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";

/**
 * Input for {@link retargetHumanoidMotion}.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Defines the caller-authoritative basis for one conversion.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Makes one target-rig conversion request reproducible.
 * @author Samchon
 */
export interface IAutoMovieHumanoidRetargetProps {
  /**
   * Clip authored on `source`.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Supplies the exact authored motion whose basis the conversion records.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Provides the authored performance evaluated by the conversion.
   */
  motion: IAutoMovieMotion;

  /**
   * Skeleton the clip was authored against.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Identifies the rig that gives the clip's clinical channels their source meaning.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Provides the source rig used to characterize the authored performance.
   */
  source: IAutoMovieSkeleton;

  /**
   * Skeleton the clip should play on.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Names the destination rig selected for the authored motion.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Provides the target rig against which converted motion is solved.
   */
  target: IAutoMovieSkeleton;

  /**
   * Optional source profile binding carrying semantic slot -> node ids.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Uses the caller's source correspondence instead of guessing concrete node names.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Characterizes source semantic slots before contact positions are measured.
   */
  sourceBinding?: IAutoMovieProfileBinding;

  /**
   * Optional target profile binding carrying semantic slot -> node ids.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Uses the caller's target correspondence instead of name similarity.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Characterizes the target nodes that receive the clinical motion.
   */
  targetBinding?: IAutoMovieProfileBinding;

  /**
   * Optional source clinical axes; defaults to the humanoid table.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Preserves the source axis basis used to read authored joint angles.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Interprets source clinical angles in the authored rig basis.
   */
  sourceJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Optional target clinical axes; defaults to the humanoid table.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Declares how clinical angles map into the chosen target joint basis.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Lowers the converted angles through the target's own characterized axes.
   */
  targetJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Optional source rest frames; defaults to the humanoid table.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Retains the source rest orientation used to measure the authored performance.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Reconstructs source effector positions in their declared rest basis.
   */
  sourceRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;

  /**
   * Optional target rest frames; defaults to the humanoid table.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Declares the target rest basis in which converted clinical channels play.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Re-solves mapped contacts against the target's characterized rest frame.
   */
  targetRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;

  /**
   * Extra bones, such as a reach end effector, that must exist on both rigs.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-refusal Makes operation-specific semantic dependencies explicit and rejectable when absent.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Extends the structural compatibility check beyond the canonical minimum.
   */
  requiredBones?: readonly AutoMovieHumanoidBone[];

  /**
   * Explicit root translation scale; omitted means target height / source
   * height.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-proportion Allows an explicit, validated root correction instead of the measured height ratio.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Applies one scale consistently to root displacement and contact mapping.
   */
  rootScale?: number;

  /**
   * Contact policy for the contact-preserving pass. Omitted runs the pass with
   * humanoid legs and no declared hand contact.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Declares which source contacts the target conversion must re-establish.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Defines the policy applied by the target contact re-solve.
   */
  contacts?: IAutoMovieRetargetContactProps;

  /**
   * Optional id for the retargeted clip.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-source-provenance Lets the caller assign the converted result's stable identity while preserving its source record.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Identifies the target clip produced by this characterized conversion.
   */
  id?: string;
}
