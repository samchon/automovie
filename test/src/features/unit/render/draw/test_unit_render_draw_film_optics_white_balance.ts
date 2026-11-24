import {
  autoMoviePlanckianWhite,
  respondAutoMovieFilmColor,
} from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * White balance adapts the Planckian white of the stated temperature to the D65
 * working white, so a neutral card under a light of that colour renders
 * neutral, and an unbalanced warm light renders warm.
 *
 * Scenarios:
 *
 * 1. An 18 % grey card under 1000 lux of the 3200 K Planckian white, exposed at
 *    the incident meter's EV100 for 1000 lux, renders with red above blue by
 *    more than 20 of 255 without `whiteBalance`.
 * 2. With `whiteBalance: 3200`, red, green and blue are within 2 of 255 of each
 *    other.
 * 3. The 3200 K white itself is warm, red above green above blue, and a 12000 K
 *    white is cool, blue above red.
 */
export function test_unit_render_draw_film_optics_white_balance(): void {
  const light: [number, number, number] = autoMoviePlanckianWhite(3200);
  const radiance: [number, number, number] = [
    (0.18 * 1000 * light[0]) / Math.PI,
    (0.18 * 1000 * light[1]) / Math.PI,
    (0.18 * 1000 * light[2]) / Math.PI,
  ];
  const optics: IAutoMovieFilmOptics = {
    ev100: Math.log2((1000 * 100) / 250),
    toneMapping: "none",
  };
  const bytes: (color: readonly number[]) => number[] = (
    color: readonly number[],
  ): number[] =>
    color.map((value: number): number =>
      Math.round(Math.min(1, Math.max(0, value)) * 255),
    );

  // 1. Unbalanced.
  const warm: number[] = bytes(
    respondAutoMovieFilmColor({ color: radiance, optics }),
  );
  TestValidator.predicate(
    "an unbalanced 3200 K card is warm",
    warm[0]! > warm[2]! + 20,
  );

  // 2. Balanced.
  const balanced: number[] = bytes(
    respondAutoMovieFilmColor({
      color: radiance,
      optics: { ...optics, whiteBalance: 3200 },
    }),
  );
  TestValidator.predicate(
    "a balanced 3200 K card is neutral",
    Math.max(...balanced) - Math.min(...balanced) <= 2,
  );

  // 3. The whites themselves.
  const blue: [number, number, number] = autoMoviePlanckianWhite(12000);
  TestValidator.predicate(
    "3200 K is warm and 12000 K cool",
    light[0] > light[1] && light[1] > light[2] && blue[2] > blue[0],
  );
}
