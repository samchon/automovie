import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  motionHumanTiming
} from "../../../../../packages/motions/src/compose/internal/motionHumanTiming";
import {
  release
} from "../../../../../packages/motions/src/throwing/internal/release";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check the cue times for a hand release.
 *
 * Scenarios:
 *
 * 1. The hold cue starts at entry. The hand opens after one brief interval
 *    and the clock ends after two.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The case specifies the entry, open cue and terminal phase in local seconds.
 * @evidence contracts/development/testing.md#behavioral-verification The release timetable supplies the cues and duration to the same three assertions.
 * @evidence contracts/development/testing.md#independent-expectations The stated brief interval sets one elapsed unit at `open` and two at the end.
 */
export function test_motions_throwing_release(): void {
  const brief: number = motionHumanTiming.PAUSES.brief;
  const clock: IAutoMovieMotionClock = release.timetable();
  TestValidator.predicate(
    "hold, then open",
    brief > 0 &&
      clock.at("hold") === 0 &&
      nclose(clock.at("open"), brief, 1e-12) &&
      nclose(clock.duration, 2 * brief, 1e-12),
  );
}
