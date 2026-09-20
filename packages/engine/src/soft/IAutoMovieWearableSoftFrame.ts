import { IAutoMovieSoftNodeTransform } from "./IAutoMovieSoftNodeTransform";
import { IAutoMovieWearableSoftActorPose } from "./IAutoMovieWearableSoftActorPose";

/**
 * Complete primary-motion snapshot for one absolute soft step.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Samples attachment and collision boundaries on the cloth clock.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Makes arbitrary seek consume the same immutable inputs.
 */
export interface IAutoMovieWearableSoftFrame {
  /**
   * Absolute fixed-step index.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Aligns primary and secondary time.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Prevents cursor-dependent sampling.
   */
  step: number;
  /**
   * Evaluated object and platform nodes.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Supports moving non-actor attachments.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Resolves node-local points before the solve.
   */
  nodes: readonly IAutoMovieSoftNodeTransform[];
  /**
   * Evaluated actors and bones.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Supplies the current body boundary.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Resolves shared capsules before projection.
   */
  actors: readonly IAutoMovieWearableSoftActorPose[];
}
