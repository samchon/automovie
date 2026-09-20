import type { IAutoMovieSoftBodyState } from "@automovie/interface";
import { IAutoMovieWearableSoftBudget } from "./IAutoMovieWearableSoftBudget";

/**
 * Wearable cloth state and its explicit admission report.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Returns secondary state derived from primary motion.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Preserves the chosen live path and its cost.
 */
export interface IAutoMovieWearableSoftResult {
  /**
   * Deterministic CPU-reference cloth state.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Preserves a complete arbitrary-seek result.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Returns finalized post-contact state.
   */
  state: IAutoMovieSoftBodyState;
  /**
   * Exact moving-boundary cost facts.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-adoption-choice Makes the selected cost visible.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Reports live solver admission.
   */
  budget: IAutoMovieWearableSoftBudget;
}
