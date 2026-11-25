import {
  blackbodyAutoMovieColor,
  heskestadFlameHeight,
  puffingFrequency,
  sampleAutoMovieFlame,
} from "@automovie/engine";
import type { IAutoMovieFlameCue } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Flame readings are determined by their authored size, seed and time.
 *
 * Scenarios:
 *
 * 1. For 32 kW the Heskestad power is exactly 4. A half-metre bed therefore gives
 *    0.43 m. At 1 kW over the same bed it gives -0.275 m. Allow eight binary64
 *    ulps at unit scale for the decimal constants and subtraction. A
 *    quarter-metre bed puffs at exactly three hertz.
 * 2. A small flame's sampled vertical envelope is exactly [0, height]. Its
 *    meridian area is positive and its seeded mesh is identical after a seek.
 * 3. A 1900 kelvin source has ordered red, green and blue channels.
 */
export function test_engine_film_sample_auto_movie_flame(): void {
  const correlationRoundoff: number = 8 * Number.EPSILON;
  TestValidator.predicate(
    "Heskestad signed height follows the correlation",
    Math.abs(heskestadFlameHeight(32, 0.5) - 0.43) <= correlationRoundoff &&
      Math.abs(heskestadFlameHeight(1, 0.5) + 0.275) <= correlationRoundoff,
  );
  TestValidator.predicate(
    "the quarter-metre bed's frequency",
    puffingFrequency(0.25) === 3,
  );

  const cue: Pick<IAutoMovieFlameCue, "id" | "seed" | "size"> = {
    id: "lamp",
    seed: 7,
    size: { kind: "small", height: 0.125, radius: 0.03125 },
  };
  const sampled: ReturnType<typeof sampleAutoMovieFlame> = sampleAutoMovieFlame(
    cue,
    1.375,
  );
  const heights: number[] = sampled.mesh.positions.filter(
    (_value: number, i: number) => i % 3 === 1,
  );
  TestValidator.predicate(
    "sway leaves the vertical envelope fixed",
    Math.min(...heights) === 0 &&
      Math.max(...heights) === 0.125 &&
      sampled.area > 0,
  );
  sampleAutoMovieFlame(cue, 2);
  sampleAutoMovieFlame(cue, 0);
  TestValidator.equals(
    "backward and forward seeks give the same seeded mesh and area",
    sampleAutoMovieFlame(cue, 1.375),
    sampled,
  );

  const color: ReturnType<typeof blackbodyAutoMovieColor> =
    blackbodyAutoMovieColor(1900);
  TestValidator.predicate(
    "warm source orders the primary channels",
    color.r > color.g && color.g > color.b,
  );
}
