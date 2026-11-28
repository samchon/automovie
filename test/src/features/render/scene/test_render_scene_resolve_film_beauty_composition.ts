import type { IAutoMovieFilmBeautyLayer } from "@automovie/interface";
import { AutoMovieRenderFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieRenderFilmResponseStage.resolveBeautyComposition` reads one layer as a cut (weight 1)
 * or a fade (fractional weight), two layers whose weights sum to one as a
 * dissolve whose alpha is the incoming weight.
 *
 * Scenarios:
 *
 * 1. One layer at weight 1 is direct; at 0.25 a fade of weight 0.25.
 * 2. Weights 0.75 and 0.25 dissolve with alpha 0.25.
 * 3. Weights 0.5 and 0.25, no layer, and weight 1.5 refuse.
 * 4. The finite blend interval includes zero and one. An unordered weight and
 *    adjacent values outside the interval refuse before composition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe cut, fade and dissolve weights and the rejected nonfinite or out-of-range values.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that composition chooses cut, fade or dissolve for valid weights and refuses unmatched sums or invalid ordered values.
 * @evidence contracts/development/testing.md#independent-expectations Uses explicit one-layer weights 1 and 0.25 and complementary weights 0.75 and 0.25, together with invalid neighboring and unordered controls.
 */
export function test_render_scene_resolve_film_beauty_composition(): void {
  const layer: (weight: number) => IAutoMovieFilmBeautyLayer = (
    weight: number,
  ): IAutoMovieFilmBeautyLayer => ({ weight });
  TestValidator.equals(
    "a cut",
    AutoMovieRenderFilmResponseStage.resolveBeautyComposition([layer(1)]).kind,
    "direct",
  );
  TestValidator.equals(
    "a fade",
    AutoMovieRenderFilmResponseStage.resolveBeautyComposition([layer(0.25)]),
    { kind: "fade", layer: layer(0.25), weight: 0.25 },
  );
  TestValidator.equals(
    "a dissolve",
    AutoMovieRenderFilmResponseStage.resolveBeautyComposition([layer(0.75), layer(0.25)]),
    {
      kind: "dissolve",
      outgoing: layer(0.75),
      incoming: layer(0.25),
      alpha: 0.25,
    },
  );
  for (const layers of [[layer(0.5), layer(0.25)], [], [layer(1.5)]])
    TestValidator.error(`${layers.length} layers refuse`, (): unknown =>
      AutoMovieRenderFilmResponseStage.resolveBeautyComposition(layers),
    );
  TestValidator.equals(
    "zero selects an admitted fade endpoint",
    AutoMovieRenderFilmResponseStage.resolveBeautyComposition([layer(0)]).kind,
    "fade",
  );
  for (const weight of [NaN, -Number.MIN_VALUE, 1 + Number.EPSILON, Infinity])
    TestValidator.predicate(
      `weight ${weight} refuses before composition`,
      throwsError(
        () => AutoMovieRenderFilmResponseStage.resolveBeautyComposition([layer(weight)]),
        "must be finite and inside [0, 1]",
      ),
    );
}
