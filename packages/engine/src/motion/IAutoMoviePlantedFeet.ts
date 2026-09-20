import { IAutoMovieMotion } from "@automovie/interface";
import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";

/**
 * A foot-corrected motion plus the stance runs that were pinned, the plant data
 * a later continuous-state pass (#597) can hand off between beats.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Couples corrected motion to the planted intervals it must preserve.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Returns the resolved performance and its support record together.
 * @author Samchon
 */
export interface IAutoMoviePlantedFeet {
  /**
   * The corrected clip: dense keyframes at the pass sample rate.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Bakes each planted phase into the articulated pose sequence.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Provides the motion after support constraints are resolved.
   */
  motion: IAutoMovieMotion;
  /**
   * Every pinned stance run, in detection order.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Preserves the ordered contact intervals detected on the fixed sample grid.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Exposes the support history that explains the corrected clip.
   */
  plants: IAutoMovieFootPlant[];
}
