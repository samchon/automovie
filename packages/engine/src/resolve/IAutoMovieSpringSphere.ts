import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A world-space collision sphere the spring chain keeps out of: a head, a
 * torso, a shoulder pad. A chain joint is pushed to the sphere's surface plus
 * the driver's own `hitRadius` (the joint's physical thickness), completing the
 * VRM SpringBone collision semantics that `hitRadius` always declared.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Represents a sampled world-space collision boundary for secondary motion.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Defines the collider input used by the live moving-boundary solve.
 * @author Samchon
 */
export interface IAutoMovieSpringSphere {
  /**
   * Sphere center in world space.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Locates the current collision boundary in the spring's world frame.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the sampled center against which secondary joints collide.
   */
  center: IAutoMovieVector3;
  /**
   * Sphere radius, meters. Strictly positive.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Bounds the collision volume that the secondary chain must remain outside.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the physical extent of the sampled secondary-motion boundary.
   */
  radius: number;
}
