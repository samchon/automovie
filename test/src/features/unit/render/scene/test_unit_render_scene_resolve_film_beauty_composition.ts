import type { IAutoMovieFilmBeautyLayer } from "@automovie/interface";
import { resolveAutoMovieFilmBeautyComposition } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveAutoMovieFilmBeautyComposition` reads one layer as a cut (weight 1)
 * or a fade (fractional weight), two layers whose weights sum to one as a
 * dissolve whose alpha is the incoming weight.
 *
 * Scenarios:
 *
 * 1. One layer at weight 1 is direct; at 0.25 a fade of weight 0.25.
 * 2. Weights 0.75 and 0.25 dissolve with alpha 0.25.
 * 3. Weights 0.5 and 0.25, no layer, and weight 1.5 refuse.
 */
export function test_unit_render_scene_resolve_film_beauty_composition(): void {
  const layer: (weight: number) => IAutoMovieFilmBeautyLayer = (
    weight: number,
  ): IAutoMovieFilmBeautyLayer => ({ weight });
  TestValidator.equals(
    "a cut",
    resolveAutoMovieFilmBeautyComposition([layer(1)]).kind,
    "direct",
  );
  TestValidator.equals(
    "a fade",
    resolveAutoMovieFilmBeautyComposition([layer(0.25)]),
    { kind: "fade", layer: layer(0.25), weight: 0.25 },
  );
  TestValidator.equals(
    "a dissolve",
    resolveAutoMovieFilmBeautyComposition([layer(0.75), layer(0.25)]),
    { kind: "dissolve", outgoing: layer(0.75), incoming: layer(0.25), alpha: 0.25 },
  );
  for (const layers of [[layer(0.5), layer(0.25)], [], [layer(1.5)]])
    TestValidator.error(`${layers.length} layers refuse`, (): unknown =>
      resolveAutoMovieFilmBeautyComposition(layers),
    );
}