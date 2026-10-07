import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Secondary-motion config: the joints that should lag/overshoot the animated
 * target (a tail, ears) and the spring that drives them.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Exposes the bounded joint, stiffness, and damping controls owned by this secondary-motion solver.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Implements the live deterministic spring choice at the sampled moving boundary.
 * @author Samchon
 */
export interface IAutoMovieSpringConfig {
  /**
   * Humanoid slots whose sampled pose axes use this player's secondary springs.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Declares the joints governed by the bounded secondary-motion solver.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Keeps the live spring choice explicit at the moving boundary.
   */
  joints: AutoMovieHumanoidBone[];

  /**
   * Stiffness parameter passed verbatim to the engine's dampedSpring solver.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Declares the spring stiffness owned by the bounded secondary-motion solver.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Keeps the live spring choice explicit at the moving boundary.
   */
  stiffness: number;

  /**
   * Damping parameter passed with the same stiffness to that solver.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Declares the spring damping owned by the bounded secondary-motion solver.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Keeps the live spring choice explicit at the moving boundary.
   */
  damping: number;
}
