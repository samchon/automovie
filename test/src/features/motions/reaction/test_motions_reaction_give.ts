import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  give
} from "../../../../../packages/motions/src/reaction/internal/give";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check the give clock and admissible intensity.
 *
 * Scenarios:
 *
 * 1. At normal intensity, reach the stroke at 0.12 s, relax at 0.27 s and
 *    finish at 0.72 s.
 * 2. Refuse intensity zero and intensity 1.5.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the timetable cues and rejected intensities.
 * @evidence contracts/development/testing.md#behavioral-verification The timetable asserts the three transition seconds and rejects intensity outside its interval.
 * @evidence contracts/development/testing.md#independent-expectations The fixed rise, hold and recovery of 0.12, 0.15 and 0.45 s give the expected cumulative times.
 */
export function test_motions_reaction_give(): void {
  const clock: IAutoMovieMotionClock = give.timetable(0.8);
  TestValidator.predicate(
    "the give and its return",
    nclose(clock.at("stroke"), 0.12, 1e-12) &&
      nclose(clock.at("relax"), 0.27, 1e-12) &&
      nclose(clock.duration, 0.72, 1e-12),
  );
  TestValidator.predicate(
    "out of range",
    throwsError(() => give.timetable(1.5)) &&
      throwsError(() => give.timetable(0)),
  );
}
