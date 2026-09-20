import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Evaluated scene-node transform available to one soft fixed step.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Resolves an object attachment from its owning frame.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Supplies one immutable moving-subject pose.
 */
export interface IAutoMovieSoftNodeTransform {
  /**
   * Stable scene-node identity.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Keeps missing attachments distinct from the world origin.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Joins the authored node binding explicitly.
   */
  node: string;
  /**
   * World position at this fixed-step boundary.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Reads primary motion on the same sample.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the current attachment translation.
   */
  worldPosition: IAutoMovieVector3;
  /**
   * World orientation at this fixed-step boundary.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Reads primary motion on the same sample.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Places the declared local offset without a stale frame.
   */
  worldRotation: IAutoMovieQuaternion;
}
