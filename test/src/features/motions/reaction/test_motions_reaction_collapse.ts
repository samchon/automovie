import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  collapseClock
} from "../../../../../packages/motions/src/reaction/internal/collapseClock";
import {
  knockdown
} from "../../../../../packages/motions/src/reaction/internal/knockdown";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check the collapse clock from the initial sag through the hold on the
 * floor.
 *
 * Scenarios:
 *
 * 1. A 0.3 s sag puts the knees down at 0.75 s and the body down at 1.4 s.
 *    The default hold ends at 2.4 s.
 * 2. Refuse a negative sag or hold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the sag, both landings, default hold and rejected times.
 * @evidence contracts/development/testing.md#behavioral-verification The clock exposes the authored transition cues and limits both variable intervals.
 * @evidence contracts/development/testing.md#independent-expectations The expected cue times add the specified 0.45 s and 1.1 s landing offsets to the sag, and the default hold adds one second.
 */
export function test_motions_reaction_collapse(): void {
  const clock: IAutoMovieMotionClock = collapseClock({ sag: 0.3 });
  TestValidator.predicate(
    "the sag, the knees and the floor",
    knockdown.SEATED === 0.45 &&
      knockdown.DOWN === 1.1 &&
      nclose(clock.at("sag"), 0.3, 1e-12) &&
      nclose(clock.at("knees"), 0.75, 1e-12) &&
      nclose(clock.at("down"), 1.4, 1e-12) &&
      nclose(clock.duration, 2.4, 1e-12),
  );
  TestValidator.predicate(
    "negative times",
    throwsError(() => collapseClock({ sag: -0.1 })) &&
      throwsError(() => collapseClock({ hold: -1 })),
  );
}
