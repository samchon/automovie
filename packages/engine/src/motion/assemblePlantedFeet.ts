import {
  type IAutoMovieFootPlant,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  type IAutoMoviePlantedFeet,
} from "@automovie/interface";

/**
 * Assemble corrected planting keyframes and stance metadata while retaining the
 * original clip's identity, clock and cycle metadata; arrays and nested records
 * are borrowed from the pass.
 */
export function assemblePlantedFeet(
  motion: IAutoMovieMotion,
  keyframes: IAutoMovieKeyframe[],
  plants: IAutoMovieFootPlant[],
): IAutoMoviePlantedFeet {
  return {
    motion: {
      ...motion,
      keyframes,
    },
    plants,
  };
}
