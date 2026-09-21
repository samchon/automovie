/**
 * A collision sphere attached to a scene node, for in-frame spring stepping:
 * the sphere rides the node's composed world position each frame.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Attaches secondary collision geometry to a time-varying scene-node frame.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Defines the node-relative collider resolved for each live spring step.
 * @author Samchon
 */
export interface IAutoMovieSpringCollider {
  /**
   * Node whose world position centers the sphere.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Names the moving scene frame that carries this collision boundary.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Resolves the collider center from the current composed node state.
   */
  node: string;
  /**
   * Sphere radius, meters. Strictly positive.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Defines the collision boundary's authored physical extent.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Carries the radius used by the live secondary-motion collision solve.
   */
  radius: number;
}
