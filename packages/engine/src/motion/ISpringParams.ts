/**
 * Stiffness (pull toward target) and damping (energy bleed) of a spring.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Keeps the author-selected response law distinct from solver state.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Declares the parameters of the selected bounded spring response.
 * @author Samchon
 */
export interface ISpringParams {
  /**
   * How hard the spring pulls toward the target. Higher = snappier.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Lets the author control target attraction while the solver performs integration.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Parameterizes the live secondary response without changing its fixed-step law.
   */
  stiffness: number;
  /**
   * How fast oscillation decays. Higher = less overshoot.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Lets the author bound energy loss while the solver owns the evolving velocity.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Controls settlement of the chosen live spring path.
   */
  damping: number;
}
