import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  athleticsClock,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `athleticsClock` times a sprint start: the crouch into the set position over
 * `CROUCH` (1.5 s), the hold to the gun, and with a drive the block exit over
 * its seconds, the rear foot off its block at the drive's middle; without one
 * the phrase closes a millisecond after the gun.
 *
 * Under the neutral manner.
 *
 * Scenarios:
 *
 * 1. Held 1 s with a 0.4 s drive: marks at 0, set at 1.5 s, the gun at 2.5 s, the
 *    rear block off at 2.7 s and the blocks left at 2.9 s, the end.
 * 2. Without a drive: no block events, the end 1 ms after the gun.
 */
export function test_unit_motions_sport_athletics_clock(): void {
  const driven: IAutoMovieMotionClock = athleticsClock(
    1,
    0.4,
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the start with a drive",
    driven.at("onYourMarks") === 0 &&
      nclose(driven.at("set"), 1.5, 1e-12) &&
      nclose(driven.at("gun"), 2.5, 1e-12) &&
      nclose(driven.at("rearBlockOff"), 2.7, 1e-12) &&
      nclose(driven.at("blockExit"), 2.9, 1e-12) &&
      nclose(driven.duration, 2.9, 1e-12),
  );
  const held: IAutoMovieMotionClock = athleticsClock(
    1,
    undefined,
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the start held to the gun",
    nclose(held.duration - held.at("gun"), 0.001, 1e-12) &&
      held
        .events()
        .every(
          (e: IAutoMovieMotionEvent): boolean =>
            e.name !== "rearBlockOff" && e.name !== "blockExit",
        ),
  );
}
