import type { IAutoMovieMotionEvent } from "@automovie/interface";
import {
  stopDropRollTimeline
} from "../../../../../packages/motions/src/reaction/internal/stopDropRollTimeline";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check the stop, drop and repeated roll timetable.
 *
 * Scenarios:
 *
 * 1. With a 1.2 s drop and two rolls, cue the drop at 0.3 s and the floor
 *    arrival at 1.5 s. End at 3.3 s.
 * 2. With no count, use four rolls and end at 5.1 s. Refuse a count of 0.2,
 *    which rounds to zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the stop and arrival cues and explicit, default and refused counts.
 * @evidence contracts/development/testing.md#behavioral-verification The test checks cue shares in film seconds, explicit and default roll counts and count admission.
 * @evidence contracts/development/testing.md#independent-expectations The totals use a 0.3 s stop plus the authored 1.2 s drop and either two or four rolls at 0.9 s each.
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
