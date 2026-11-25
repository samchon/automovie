import type { IAutoMovieProductionDesign } from "@automovie/interface";
import { resolveProductionRenderTierFrameFormat } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveProductionRenderTierFrameFormat` keeps the source format for the
 * final tier and, for a proxy, scales it to even dimensions of at least 2 and
 * divides the frame rate by the frame step.
 *
 * Scenarios, from 1920×1080 at 24/1 with a crop:
 *
 * 1. The final tier gives an equal copy.
 * 2. A proxy at scale 0.5 and step 2 is 960×540 at 24/2 = 12/1 fps with the crop
 *    kept.
 * 3. A proxy at scale 0.001 and step 1 floors to 2×2 at 24 fps.
 */
export function test_render_film_resolve_production_render_tier_frame_format(): void {
  const source: IAutoMovieProductionDesign["frameFormat"] = {
    width: 1920,
    height: 1080,
    fps: 24,
    frameRate: { numerator: 24, denominator: 1 },
    colorSpace: "srgb",
    crop: { left: 0, top: 0.1, right: 1, bottom: 0.9 },
  };
  const final: IAutoMovieProductionDesign["frameFormat"] =
    resolveProductionRenderTierFrameFormat(source, {
      kind: "final",
      resolutionScale: 1,
      frameStep: 1,
    });
  TestValidator.predicate(
    "an equal copy",
    final !== source && JSON.stringify(final) === JSON.stringify(source),
  );
  TestValidator.equals(
    "a half proxy",
    resolveProductionRenderTierFrameFormat(source, {
      kind: "proxy",
      resolutionScale: 0.5,
      frameStep: 2,
    }),
    {
      width: 960,
      height: 540,
      fps: 12,
      frameRate: { numerator: 12, denominator: 1 },
      colorSpace: "srgb",
      crop: { left: 0, top: 0.1, right: 1, bottom: 0.9 },
    },
  );
  const tiny: IAutoMovieProductionDesign["frameFormat"] =
    resolveProductionRenderTierFrameFormat(source, {
      kind: "proxy",
      resolutionScale: 0.001,
      frameStep: 1,
    });
  TestValidator.equals(
    "the smallest proxy",
    [tiny.width, tiny.height, tiny.fps],
    [2, 2, 24],
  );
}
