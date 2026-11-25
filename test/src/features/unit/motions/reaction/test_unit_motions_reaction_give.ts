import type { IAutoMovieMotionClock } from "@automovie/interface";
import { give } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * The `give` law's timetable (`give.timetable`): the body gives over `RISE`
 * (0.12 s) to the `stroke`, holds 0.15 s and recovers over 0.45 s; its intensity
 * lies in (0, 1].
 *
 * Scenarios:
 *
 * 1. The give strikes at 0.12 s, relaxes at 0.27 s and ends at 0.72 s.
 * 2. An intensity of 1.5, or of none, is refused.
 */
export function test_unit_motions_reaction_give(): void {
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