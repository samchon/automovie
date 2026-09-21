import { IAutoMovieSpringState } from "./IAutoMovieSpringState";
import { IAutoMovieSpringCollider } from "./IAutoMovieSpringCollider";

/**
 * The cross-frame inputs that let {@link resolveFrame} step spring drivers
 * inside the frame pass: the previous-step state, the timestep, and optional
 * node-attached collision spheres. Springs are the one stateful driver: with
 * this the engine advances them deterministically frame-to-frame; without it
 * they defer exactly as before.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-adoption-choice Enables the live deterministic spring path for a frame.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Defines the explicit live-secondary input to frame resolution.
 * @author Samchon
 */
export interface IAutoMovieResolveSprings {
  /**
   * Cross-frame Verlet state, advanced in place.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Carries the solver-owned history required by the selected live path.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies persistent state to deterministic spring evaluation.
   */
  state: IAutoMovieSpringState;
  /**
   * Seconds since the previously resolved frame. Strictly positive.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Fixes the integration interval used by the live secondary solver.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the bounded timestep for deterministic spring advancement.
   */
  dt: number;
  /**
   * Collision spheres riding scene nodes. Omit for none.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Supplies the node-attached boundaries sampled for this spring step.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Carries the moving collision set used by live secondary resolution.
   */
  colliders?: IAutoMovieSpringCollider[];
}
