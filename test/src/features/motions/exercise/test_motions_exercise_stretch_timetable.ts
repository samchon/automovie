import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import {
  stretch
} from "../../../../../packages/motions/src/exercise/internal/stretch";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `stretch` law's timetable (`stretch.timetable`): entered over 1.5 s,
 * held, left over 1.5 s; the reach ends as the hold begins, the release opens
 * the way out, the weight shifts halfway in and lowers halfway out.
 *
 * Scenario: held 5 s in a neutral manner, the reach ends at 1.5 s, the shift is
 * at 0.75 s, the release at 6.5 s, the lowering at 7.25 s and the end at 8 s.
 */
export function test_motions_exercise_stretch_timetable(): void {
  const clock: IAutoMovieMotionClock = stretch.timetable(
    5,
    motionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the stretch's cues",
    stretch.ENTER === 1.5 &&
      clock.at("enter") === 0 &&
      nclose(clock.at("reachEnd"), 1.5, 1e-12) &&
      nclose(clock.at("shifted"), 0.75, 1e-12) &&
      nclose(clock.at("release"), 6.5, 1e-12) &&
      nclose(clock.at("lowered"), 7.25, 1e-12) &&
      nclose(clock.duration, 8, 1e-12),
  );
}
