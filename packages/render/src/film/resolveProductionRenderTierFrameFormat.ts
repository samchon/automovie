import {
  canonicalProductionFrameRate,
  resolveProductionFrameRate,
} from "@automovie/engine";
import type {
  IAutoMovieProductionDesign,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import type { IAutoMovieProductionRenderTier } from "./IAutoMovieProductionRenderTier";
import { normalizeRenderTier } from "./normalizeRenderTier";

/**
 * Project a production's frame format through a render tier.
 *
 * The final tier returns a copy of the source unchanged. A proxy scales width
 * and height by `resolutionScale`, rounding each down to an even pixel count
 * of at least 2, divides the exact frame rate by `frameStep` and reduces it,
 * sets `fps` to that rate's decimal value, and keeps the color space and crop.
 * Throws when the tier is not admissible under `normalizeRenderTier` or the
 * source frame rate is invalid on the proxy branch. Final returns the source copy before rate resolution and performs no raster or rate admission.
 *
 * @evidence contracts/common.md#principled-implementation Keeping every Nth frame of a rational clock n/d gives n/(d*N), reduced by canonicalProductionFrameRate after the denominator product is formed in binary64; an overflowed or unsafe term is refused by that helper. Proxy raster flooring yields even dimensions with a two-pixel minimum, which can exceed a tiny scaled source. Valid source raster and crop are caller premises, and final returns an unchecked copy.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only the projection; tier admission is `normalizeRenderTier`'s and frame-rate resolution the engine's, so the planner and publication's identity check derive the same output format from one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raster, rate or production is special-cased; the minimum of 2 pixels is the smallest even raster and applies only when a tiny source and scale would round to zero.
 * @evidence contracts/common.md#meaningful-documentation The doc states the final-tier behavior, the raster rounding and its floor, how the rate is divided and reduced, which fields are kept, and when the call throws.
 * @evidence contracts/performance.md#efficient-algorithms The call does constant work: one tier check, one rate resolution and reduction by greatest common divisor, and one small record copy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner and publication's identity check each call it once per plan or identity on a few-field record, so there is no costly equivalent work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing after returning a new format its caller owns and opens no handle or task.
 */
export const resolveProductionRenderTierFrameFormat: (
  source: IAutoMovieProductionDesign["frameFormat"],
  tier: IAutoMovieProductionRenderTier,
) => IAutoMovieProductionDesign["frameFormat"] = (
  source: IAutoMovieProductionDesign["frameFormat"],
  tier: IAutoMovieProductionRenderTier,
): IAutoMovieProductionDesign["frameFormat"] => {
  const normalized: IAutoMovieProductionRenderTier = normalizeRenderTier(tier);
  if (normalized.kind === "final") return structuredClone(source);
  const even: (value: number) => number = (value: number): number =>
    Math.max(2, Math.floor((value * normalized.resolutionScale) / 2) * 2);
  const sourceRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(source);
  const frameRate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    {
      numerator: sourceRate.numerator,
      denominator: sourceRate.denominator * normalized.frameStep,
    },
  );
  return {
    width: even(source.width),
    height: even(source.height),
    fps: frameRate.numerator / frameRate.denominator,
    frameRate,
    colorSpace: source.colorSpace,
    ...(source.crop === undefined
      ? {}
      : { crop: structuredClone(source.crop) }),
  };
};
