import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";

/**
 * A foot-corrected motion and the stance runs whose targets drove its solve.
 * The targets are intent, not a certificate of zero FK residual after ROM
 * clamping; beat handoff reuses their authoritative model-frame positions.
 *
 * @evidence contracts/development/design.md#principled-representation Couples densely re-keyed planting output with the inclusive stance runs and fixed targets detected from the input, preserving the distinction between requested contact and the actual constrained articulation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One result feeds both ordinary motion playback and foot-plant handoff, while each consumer reads only the clip or compact stance metadata it needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A plant record does not certify exact reachable contact; the solved pose remains subject to target ROM and actual FK measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies solve targets, dense sample clock, detection order, model-frame handoff and the limit of what recorded plants prove.
 */
export interface IAutoMoviePlantedFeet {
  /** The corrected clip: dense keyframes at the pass sample rate. */
  motion: IAutoMovieMotion;

  /** Every pinned stance run, in detection order. */
  plants: IAutoMovieFootPlant[];
}
