import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieProductionDesign,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionRenderTier,
} from "@automovie/interface";

import { normalizeRenderTier } from "./normalizeRenderTier";

/*
 * Project a production's frame format through a render tier.
 *
 * The final tier returns a copy of the source unchanged. A proxy scales width
 * and height by `resolutionScale`, rounding each down to an even pixel count of
 * at least 2, divides the exact frame rate by `frameStep` and reduces it, sets
 * `fps` to that rate's decimal value, and keeps the color space and crop.
 * Throws when the tier is not admissible under `normalizeRenderTier` or the
 * source frame rate is invalid on the proxy branch. Final returns the source
 * copy before rate resolution and performs no raster or rate admission.
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
    AutoMovieEngineFilm.resolveProductionFrameRate(source);
  const frameRate: IAutoMovieProductionFrameRate = AutoMovieEngineFilm.canonicalProductionFrameRate(
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
