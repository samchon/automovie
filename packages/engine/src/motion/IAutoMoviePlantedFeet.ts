import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";

/**
 * A foot-corrected motion plus the stance runs that were pinned, the plant data
 * a later continuous-state pass (#597) can hand off between beats.
 *
 * @author Samchon
 */
export interface IAutoMoviePlantedFeet {
  /** The corrected clip: dense keyframes at the pass sample rate. */
  motion: IAutoMovieMotion;
  /** Every pinned stance run, in detection order. */
  plants: IAutoMovieFootPlant[];
}
