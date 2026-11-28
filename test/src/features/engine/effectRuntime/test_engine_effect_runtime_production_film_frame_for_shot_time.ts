import { AutoMovieEngineEffect } from "@automovie/engine";
import type { IAutoMovieFilmTimeline } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectTimeline } from "../../internal/filmEffectTimeline";

/**
 * `productionFilmFrameForShotTime` maps a shot's source time to the film frame
 * that shows it, or null when the film does not show it.
 *
 * Scenarios, on a 24 fps film whose one segment shows shot "shot" frames 0..48
 * at film frames 0..48:
 *
 * 1. 0.5 s is source frame 12, film frame 12.
 * 2. 0 s is film frame 0.
 * 3. A negative time, a time past the segment (3 s is frame 72) and an unshown
 *    shot are null.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines mapping from shown shot time to film frame and null for time or shot outside the edit.
 * @evidence contracts/development/testing.md#behavioral-verification Queries start, half-second, negative, beyond-end and unshown shot times against a 48-frame segment.
 * @evidence contracts/development/testing.md#independent-expectations Frame arithmetic gives 0 and 12 at 24 fps. Three seconds maps to 72 beyond the segment and cannot return a film frame.
 */
export function test_engine_effect_runtime_production_film_frame_for_shot_time(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline();
  TestValidator.equals(
    "half a second",
    AutoMovieEngineEffect.productionFilmFrameForShotTime({ timeline, shot: "shot", time: 0.5 }),
    12,
  );
  TestValidator.equals(
    "the start",
    AutoMovieEngineEffect.productionFilmFrameForShotTime({ timeline, shot: "shot", time: 0 }),
    0,
  );
  TestValidator.equals(
    "not shown",
    [
      AutoMovieEngineEffect.productionFilmFrameForShotTime({ timeline, shot: "shot", time: -1 }),
      AutoMovieEngineEffect.productionFilmFrameForShotTime({ timeline, shot: "shot", time: 3 }),
      AutoMovieEngineEffect.productionFilmFrameForShotTime({ timeline, shot: "other", time: 0.5 }),
    ],
    [null, null, null],
  );
}
