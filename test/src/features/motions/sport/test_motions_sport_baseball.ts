import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  AutoMovieMotionHumanBaseball
} from "../../../../../packages/motions/src/sport/internal/AutoMovieMotionHumanBaseball";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `baseball` law's timetable (`AutoMovieMotionHumanBaseball.timetable`):
 * 0.8 s to get ready, a 0.3 s attack, the hold and a 0.8 s return.
 *
 * Scenario: held 1 s in a neutral manner, ready at 0.8 s, the stroke at 1.1 s,
 * relaxed at 2.1 s, ending at 2.9 s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines timing of the neutral baseball motion's preparation, stroke, authored hold and return.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the timetable with a one-second neutral hold and reads the four named phase times.
 * @evidence contracts/development/testing.md#independent-expectations Summing 0.8 s preparation and 0.3 s stroke puts the action at 1.1 s. Hold and return end at 2.1 and 2.9 s.
 */
export function test_motions_sport_baseball(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionHumanBaseball.timetable(
    1,
    motionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the phrase",
    nclose(clock.at("ready"), 0.8, 1e-12) &&
      nclose(clock.at("stroke"), 1.1, 1e-12) &&
      nclose(clock.at("relax"), 2.1, 1e-12) &&
      nclose(clock.duration, 2.9, 1e-12),
  );
}
