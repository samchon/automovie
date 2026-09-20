import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One planted-foot stance run the pass detected and pinned: the foot stayed on
 * the ground from `start` to `end` and its world position was held at
 * `position` (its `y` snapped to the ground plane).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Records one contiguous planted phase and its authoritative support point.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Makes the detected support interval and target inspectable.
 * @author Samchon
 */
export interface IAutoMovieFootPlant {
  /**
   * The planted foot bone.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Associates the planted phase with its contacting effector.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Identifies which support limb owns the interval.
   */
  foot: AutoMovieHumanoidBone;
  /**
   * Inclusive stance-run start, seconds.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Marks the sample at which the foot enters its planted phase.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Uses this instant as the inclusive lower boundary of support sampling.
   */
  start: number;
  /**
   * Inclusive stance-run end, seconds.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Marks the last sample owned by the planted phase before release.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Includes this final instant in the planted phase before release.
   */
  end: number;
  /**
   * Pinned world foot position held across the run (`y` = ground height).
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Carries the authoritative world target and its ground height.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Defines the support point held throughout the planted interval.
   */
  position: IAutoMovieVector3;
}
