import { AutoMovieEngineRenderShadow } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `normalizeShadowFilter` folds the three declared shadow filters onto
 * the two the renderer implements.
 *
 * Scenarios:
 *
 * 1. `pcf` and `pcfSoft` both map to `pcf`.
 * 2. `vsm` stays `vsm`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the shared pcf result and retained vsm result for all three declared inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls RenderShadow.normalizeAutoMovieShadowFilter with each supported filter literal.
 * @evidence contracts/development/testing.md#independent-expectations The supported mapping is pcf and pcfSoft to pcf, and vsm to itself. These three literal expected values exercise every branch.
 */
export function test_engine_render_normalize_shadow_filter(): void {
  TestValidator.equals(
    "folded filters",
    [
      AutoMovieEngineRenderShadow.normalizeAutoMovieShadowFilter("pcf"),
      AutoMovieEngineRenderShadow.normalizeAutoMovieShadowFilter("pcfSoft"),
      AutoMovieEngineRenderShadow.normalizeAutoMovieShadowFilter("vsm"),
    ],
    ["pcf", "pcf", "vsm"],
  );
}
