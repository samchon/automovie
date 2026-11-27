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
 * The `release` law's timetable (`release.timetable`): the grip held a brief
 * pause, then opened over another.
 *
 * Scenario: the hold opens the release, the hand opens one brief pause in, and
 * the release ends two in.
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
