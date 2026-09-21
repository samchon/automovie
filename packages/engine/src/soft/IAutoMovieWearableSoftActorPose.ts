import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";

/**
 * Evaluated actor skeleton available to one soft fixed step.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Resolves actor-bone attachments explicitly.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Supplies the immutable skeletal boundary.
 */
export interface IAutoMovieWearableSoftActorPose {
  /**
   * Stable actor participant identity.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Prevents a missing actor from becoming an origin collider.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Joins shared capsules to their actor.
   */
  actor: string;
  /**
   * Resolved humanoid bones at this boundary.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Reads the current primary performance.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies current anchor and collider transforms.
   */
  bones: readonly IAutoMovieResolvedBone[];
}
