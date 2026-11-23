import type { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/**
 * A foot-corrected motion and the stance runs whose targets drove its solve.
 * The targets are intent, not a certificate of zero FK residual after ROM
 * clamping; beat handoff reuses their authoritative model-frame positions.
 */
export interface IAutoMoviePlantedFeet {
  /** The corrected clip: dense keyframes at the pass sample rate. */
  motion: IAutoMovieMotion;

  /** Every pinned stance run, in detection order. */
  plants: IAutoMovieFootPlant[];
}
