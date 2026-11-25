import type { IAutoMovieMotionClock } from "@automovie/interface";
import { AutoMovieMotionManner, gymnastics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `gymnastics` law's timetable (`gymnastics.timetable`): entered over 1.5
 * s, the hands down halfway in and the body inverted as it ends, held, and
 * released halfway out.
 *
 * Scenario: held 2 s in a neutral manner, the hands are down at 0.75 s, the
 * body inverted at 1.5 s, released at 4.25 s, and the skill ends at 5 s.
 */
export function test_motions_sport_gymnastics_timetable(): void {
  const clock: IAutoMovieMotionClock = gymnastics.timetable(
    2,
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the skill's cues",
    nclose(clock.at("handsDown"), 0.75, 1e-12) &&
      nclose(clock.at("inverted"), 1.5, 1e-12) &&
      nclose(clock.at("release"), 4.25, 1e-12) &&
      nclose(clock.duration, 5, 1e-12),
  );
}
