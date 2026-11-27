import { AutoMovieEngineRenderShadow } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `normalizeShadowFilter` folds the three declared shadow filters onto
 * the two the renderer implements.
 *
 * Scenarios:
 *
 * 1. Pcf and pcfSoft are pcf.
 * 2. Vsm is vsm.
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
