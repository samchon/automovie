import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  knockdown
} from "../../../../../packages/motions/src/reaction/internal/knockdown";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check the landing cues and floor hold for a knockdown.
 *
 * Scenarios:
 *
 * 1. With a two-second hold, seat and stroke coincide at 0.45 s. Rolling
 *    starts before the seat, and down and relax coincide at 1.1 s.
 * 2. End at 3.1 s with the authored hold and 2.1 s with the default. Refuse a
 *    negative hold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the two landings, default hold and invalid duration.
 * @evidence contracts/development/testing.md#behavioral-verification The clock asserts cue order, the two landing instants and the hold policy.
 * @evidence contracts/development/testing.md#independent-expectations The expected end times add the authored two seconds or the default one second to the specified 1.1 s body landing.
 */
export function test_motions_reaction_knockdown(): void {
  const clock: IAutoMovieMotionClock = knockdown.timetable(2);
  TestValidator.predicate(
    "seated, down, lying",
    nclose(clock.at("seated"), 0.45, 1e-12) &&
      nclose(clock.at("stroke"), 0.45, 1e-12) &&
      nclose(clock.at("down"), 1.1, 1e-12) &&
      nclose(clock.at("relax"), 1.1, 1e-12) &&
      nclose(clock.duration, 3.1, 1e-12) &&
      clock.at("rolling") < 0.45 &&
      nclose(knockdown.timetable(undefined).duration, 2.1, 1e-12),
  );
  TestValidator.predicate(
    "a negative lie",
    throwsError(() => knockdown.timetable(-1)),
  );
}
