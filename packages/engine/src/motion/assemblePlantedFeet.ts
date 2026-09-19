import { IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";
import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import { IAutoMoviePlantedFeet } from "./IAutoMoviePlantedFeet";

/**
 * Wrap the corrected keyframes + plants as the pass result.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Returns both the corrected motion and the planted intervals that explain it.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Couples the support observations to their baked motion result.
 */
export const assemblePlantedFeet = (
  motion: IAutoMovieMotion,
  keyframes: IAutoMovieKeyframe[],
  plants: IAutoMovieFootPlant[],
): IAutoMoviePlantedFeet => ({
  motion: {
    ...motion,
    keyframes,
  },
  plants,
});
