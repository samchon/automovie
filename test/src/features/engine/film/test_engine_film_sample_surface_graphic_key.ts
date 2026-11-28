import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * An admitted surface track holds the last key at or before the read time.
 *
 * Scenarios:
 *
 * 1. An authored key owns its exact boundary. Forward and reverse seeks over four
 *    keys yield the respective held indices and the last key holds.
 * 2. A read before the first possible key refuses with the target address.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the exact-key and held-tail behavior, reverse reads and the target-scoped early refusal.
 * @evidence contracts/development/testing.md#behavioral-verification The test reads the admitted track through the surface key sampler at exact and intermediate query times in both orders, then checks an addressed query before its first key.
 * @evidence contracts/development/testing.md#independent-expectations The four authored key times directly define the greatest time no later than the query. The held result is a function of that time alone. At -0.125 no key precedes the query, so the track's target must appear in the refusal.
 */
export function test_engine_film_sample_surface_graphic_key(): void {
  const graphic: IAutoMovieSurfaceGraphic = {
    emission: { kind: "printed" },
    background: null,
    layers: [],
  };
  const track: IAutoMovieSurfaceGraphicTrack = {
    node: "panel",
    surface: "face",
    keys: [0, 0.25, 0.5, 0.75].map((time: number) => ({ time, graphic })),
  };
  TestValidator.equals(
    "upper bound is stable in either seek direction",
    [0, 0.125, 0.25, 0.5, 0.75, 1, 0.375, 0].map((t: number) =>
      AutoMovieEngineFilm.sampleSurfaceGraphicKey(track, t),
    ),
    [0, 0, 1, 2, 3, 3, 1, 0],
  );
  TestValidator.predicate(
    "before opening has no key",
    throwsError(
      (): number => AutoMovieEngineFilm.sampleSurfaceGraphicKey(track, -0.125),
      'Surface graphic "panel/face" cannot be sampled',
    ),
  );
}
