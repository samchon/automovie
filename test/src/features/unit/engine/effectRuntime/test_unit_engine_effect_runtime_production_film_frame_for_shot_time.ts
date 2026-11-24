import { productionFilmFrameForShotTime } from "@automovie/engine";
import type { IAutoMovieFilmTimeline } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectTimeline } from "../../../internal/filmEffectTimeline";

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
 */
export function test_unit_engine_effect_runtime_production_film_frame_for_shot_time(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline();
  TestValidator.equals(
    "half a second",
    productionFilmFrameForShotTime({ timeline, shot: "shot", time: 0.5 }),
    12,
  );
  TestValidator.equals(
    "the start",
    productionFilmFrameForShotTime({ timeline, shot: "shot", time: 0 }),
    0,
  );
  TestValidator.equals(
    "not shown",
    [
      productionFilmFrameForShotTime({ timeline, shot: "shot", time: -1 }),
      productionFilmFrameForShotTime({ timeline, shot: "shot", time: 3 }),
      productionFilmFrameForShotTime({ timeline, shot: "other", time: 0.5 }),
    ],
    [null, null, null],
  );
}
