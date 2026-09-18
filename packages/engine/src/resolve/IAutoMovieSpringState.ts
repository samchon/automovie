import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Cross-frame state for the spring driver: each chain joint's world position on
 * the previous step, which the Verlet integrator differences against the
 * current position to recover velocity. The caller owns one of these per scene
 * and threads it through {@link stepSpring}, either directly, or by handing it
 * to {@link "./resolveFrame".resolveFrame} via its `springs` input, which then
 * steps every spring driver inside the frame pass (S2). Without a state and a
 * `dt` the per-frame resolve has no memory, so springs defer.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Holds the solver-owned cross-frame state separately from authored spring parameters.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Defines the deterministic live-state record for the selected secondary-motion path.
 * @author Samchon
 */
export interface IAutoMovieSpringState {
  /**
   * Joint id → its world position last step (empty on the first step).
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Stores the prior joint positions owned by the live secondary solver.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies the previous-step state needed for deterministic spring integration.
   */
  prev: Map<string, IAutoMovieVector3>;
  /**
   * Center node id -> its world position last step for center-relative inertia.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Tracks the prior position of each moving attachment boundary.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Keeps spring inertia relative to the sampled moving center.
   */
  centers: Map<string, IAutoMovieVector3>;
  /**
   * Joint id → its **post-spring** world position last step, what a host loop
   * would have left in its carried world map. {@link resolveFrame} composes the
   * scene fresh every frame, so it seeds each chain joint from here before
   * stepping; that is what lets the in-frame spring accumulate sag across
   * frames exactly like the host-loop harness.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Preserves the solver-produced joint state carried into the next fixed step.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Carries live secondary output across freshly composed frames.
   */
  sprung: Map<string, IAutoMovieVector3>;
}
