import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";

/**
 * A foot-corrected motion and the stance runs whose targets drove its solve.
 * The targets are intent, not a certificate of zero FK residual after ROM
 * clamping; beat handoff reuses their authoritative model-frame positions.
 *
 * @evidence contracts/common.md#principled-implementation Couples densely re-keyed planting output with the inclusive stance runs and fixed targets detected from the input, preserving the distinction between requested contact and the actual constrained articulation.
 * @evidence contracts/common.md#clear-and-simple-design One result feeds both ordinary motion playback and foot-plant handoff, while each consumer reads only the clip or compact stance metadata it needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A plant record does not certify exact reachable contact; the solved pose remains subject to target ROM and actual FK measurement.
 * @evidence contracts/common.md#meaningful-documentation Identifies solve targets, dense sample clock, detection order, model-frame handoff and the limit of what recorded plants prove.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result contains no stance-detection or chain-fitting algorithm; plantStanceFeet and its stages own that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Beat continuity reuses explicitly returned targets rather than re-detecting them, and no cross-motion cache is defined by this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result owns corrected keyframes and one record per detected stance run, with population bounded by the sampled frame and leg counts.
 *
 * @author Samchon
 */
export interface IAutoMoviePlantedFeet {
  /** The corrected clip: dense keyframes at the pass sample rate. */
  motion: IAutoMovieMotion;

  /** Every pinned stance run, in detection order. */
  plants: IAutoMovieFootPlant[];
}
