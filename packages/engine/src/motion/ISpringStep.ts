/**
 * Per-axis state a {@link dampedSpring} threads across frames.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Separates the solver-owned evolving state from the author's target.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Carries the bounded state needed by the selected live secondary-motion path.
 * @author Samchon
 */
export interface ISpringStep {
  /**
   * The sprung value this step.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Reports the solver result without rewriting the authored target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Exposes the live channel value produced at the fixed step.
   */
  value: number;
  /**
   * Velocity carried into the next step.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Keeps solver history explicit rather than hidden in global playback state.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the bounded continuation state for the next live step.
   */
  velocity: number;
}
