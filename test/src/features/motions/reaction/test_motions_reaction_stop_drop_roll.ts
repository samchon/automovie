import type { IAutoMovieMotionEvent } from "@automovie/interface";
import { stopDropRollTimeline } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `stopDropRoll` law's timetable (`stopDropRollTimeline`): stopped 0.3 s,
 * dropped over the collapse's own length, then rolled onto a side and back 0.9
 * s per roll, four rolls by default.
 *
 * Scenarios:
 *
 * 1. After a 1.2 s drop, two rolls end at 0.3 + 1.2 + 1.8 = 3.3 s, the drop cued
 *    at 0.3 s and the body down at 1.5 s.
 * 2. With no count it rolls four times, 5.1 s in all.
 * 3. Rolls rounding to none are refused.
 */
export function test_motions_reaction_stop_drop_roll(): void {
  const two: stopDropRollTimeline.ITimeline = stopDropRollTimeline(2, 1.2);
  TestValidator.predicate(
    "the stop, the drop and the rolls",
    nclose(two.duration, 3.3, 1e-12) &&
      nclose(
        two.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === "drop",
        )!.share * 3.3,
        0.3,
        1e-12,
      ) &&
      nclose(
        two.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === "down",
        )!.share * 3.3,
        1.5,
        1e-12,
      ),
  );
  TestValidator.predicate(
    "four by default, none refused",
    stopDropRollTimeline(undefined, 1.2).rolls === 4 &&
      nclose(stopDropRollTimeline(undefined, 1.2).duration, 5.1, 1e-12) &&
      throwsError(() => stopDropRollTimeline(0.2, 1.2)),
  );
}
