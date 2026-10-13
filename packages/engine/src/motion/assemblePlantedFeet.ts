import { IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import { IAutoMoviePlantedFeet } from "./IAutoMoviePlantedFeet";

/** Wrap the corrected keyframes + plants as the pass result. */
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
