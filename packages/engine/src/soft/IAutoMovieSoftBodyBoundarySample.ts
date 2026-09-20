import { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";

/**
 * Complete moving boundary for one absolute fixed step.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Aligns primary-motion and secondary-motion samples.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Defines the per-step boundary handoff.
 */
export interface IAutoMovieSoftBodyBoundarySample {
  /**
   * Absolute solver step.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Fixes which primary-motion sample is consumed.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Keeps seek deterministic.
   */
  step: number;
  /**
   * Resolved hard anchors for this step.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Drives attachments from declared motion.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Separates static and moving inputs.
   */
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[];
  /**
   * Resolved body capsules for this step.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Shares validation collision geometry.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Applies current collider state.
   */
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[];
}
