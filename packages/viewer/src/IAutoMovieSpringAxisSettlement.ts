import type { ISpringStep } from "@automovie/engine";

/**
 * One axis's displayed angle and the solver state carried to the next frame.
 * Null keeps a never-authored, never-sprung axis absent; an existing spring may
 * still decay after its target disappears. State retention is the player's.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Separates the displayed channel from solver-owned continuation state.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Preserves the live spring result and absent-axis alternative at each bounded step.
 * @author Samchon
 */
export interface IAutoMovieSpringAxisSettlement {
  /**
   * Sprung pose angle in degrees, or null when both target and spring history are absent.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Carries the solver result without rewriting the authored target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Retains the absent-channel alternative independently of evolving spring state.
   */
  angle: number | null;

  /**
   * Axis value and velocity retained by this player's per-joint spring map.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Keeps history local to the selected spring rather than global playback state.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Supplies continuation for the next update, including zero elapsed time.
   */
  next: ISpringStep;
}
