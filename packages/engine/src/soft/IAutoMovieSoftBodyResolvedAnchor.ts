import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One hard anchor target resolved on the soft solver's fixed step.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Samples moving anchors on the same deterministic clock as cloth.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Carries an already resolved anchor boundary into one step.
 */
export interface IAutoMovieSoftBodyResolvedAnchor {
  /**
   * Anchored row-major particle index.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Keeps the authored cloth attachment identity.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Identifies the hard boundary particle.
   */
  particle: number;
  /**
   * World-space target sampled for this step.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Derives cloth motion from the resolved primary motion.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the selected moving boundary without inventing it.
   */
  position: IAutoMovieVector3;
}
