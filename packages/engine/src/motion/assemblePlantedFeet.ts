import { IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import { IAutoMoviePlantedFeet } from "./IAutoMoviePlantedFeet";


/**
 * Assemble corrected planting keyframes and stance metadata while retaining the original clip's identity, clock and cycle metadata; arrays and nested records are borrowed from the pass.
 *
 * @evidence contracts/common.md#principled-implementation Replaces only motion.keyframes with the already solved dense frames and pairs it with detected stance records, preserving the original clip's duration and gait clock.
 * @evidence contracts/common.md#clear-and-simple-design This final assembly seam packages the detection and re-key stages without duplicating IK, stance grouping or motion sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No residual is hidden or contact fabricated at assembly; the helper trusts the pass's parallel frames and plant records without modifying them.
 * @evidence contracts/common.md#meaningful-documentation States which clip fields persist and that supplied arrays and nested records are shared with the result.
 * @evidence contracts/performance.md#efficient-algorithms One shallow motion copy and one result object take constant work relative to keyframe and plant populations; no frame array is recopied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result directly shares completed keyframes and stance metadata from the owning pass rather than running detection or IK again.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the assembled result and its borrowed arrays; the helper retains no additional state or disposal-capable resource.
 */
export const assemblePlantedFeet: (motion: IAutoMovieMotion, keyframes: IAutoMovieKeyframe [ ], plants: IAutoMovieFootPlant [ ]) => IAutoMoviePlantedFeet = (
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
