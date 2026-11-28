import { AutoMovieEngineFilmResponse } from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `respondFilmColor` adapts the Planckian white of the stated
 * temperature to the D65 working white, and `planckianWhite` is warm
 * below D65 and cool above.
 *
 * Scenarios:
 *
 * 1. An 18 percent grey card under 1000 lux of the 3200 K white, exposed at EV100
 *    log2(1000 * 100 / 250), renders with red above blue by more than 20 of 255
 *    without `whiteBalance`.
 * 2. With `whiteBalance: 3200` its three channels are within 2 of 255 of each
 *    other.
 * 3. The 3200 K white has red above green above blue, and the 12000 K white has
 *    blue above red.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the grey-card reflectance, illumination and exposure and compare unbalanced warmth, neutral correction and hot-source hue.
 * @evidence contracts/development/testing.md#behavioral-verification The test builds the radiance from a Planckian source, passes it through the film response with the same optics under two white-balance settings, and compares the resulting channels and a cooler source.
 * @evidence contracts/development/testing.md#independent-expectations The reference card uses 18 percent grey under 1000 lux and exposure log2(1000 times 100 divided by 250). At 3200 K the uncorrected red and blue separation exceeds 20 in 255, while balancing to the source places channels within two. At 12000 K blue exceeds red.
 */
export function test_engine_film_respond_film_color_white_balance(): void {
  const light: [number, number, number] = AutoMovieEngineFilmResponse.autoMoviePlanckianWhite(3200);
  const radiance: [number, number, number] = [
    (0.18 * 1000 * light[0]) / Math.PI,
    (0.18 * 1000 * light[1]) / Math.PI,
    (0.18 * 1000 * light[2]) / Math.PI,
  ];
  const optics: IAutoMovieFilmOptics = {
    ev100: Math.log2((1000 * 100) / 250),
    toneMapping: "none",
  };
  const bytes = (color: readonly number[]): number[] =>
    color.map((value: number): number =>
      Math.round(Math.min(1, Math.max(0, value)) * 255),
    );
  const warm: number[] = bytes(
    AutoMovieEngineFilmResponse.respondAutoMovieFilmColor({ color: radiance, optics }),
  );
  TestValidator.predicate("unbalanced is warm", warm[0]! > warm[2]! + 20);
  const balanced: number[] = bytes(
    AutoMovieEngineFilmResponse.respondAutoMovieFilmColor({
      color: radiance,
      optics: { ...optics, whiteBalance: 3200 },
    }),
  );
  TestValidator.predicate(
    "balanced is neutral",
    Math.max(...balanced) - Math.min(...balanced) <= 2,
  );
  const cool: [number, number, number] = AutoMovieEngineFilmResponse.autoMoviePlanckianWhite(12000);
  TestValidator.predicate(
    "3200 K is warm and 12000 K cool",
    light[0] > light[1] && light[1] > light[2] && cool[2] > cool[0],
  );
}
