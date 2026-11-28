import type { IAutoMovieMotionEvent } from "@automovie/interface";
import {
  HumanRide
} from "../../../../../packages/motions/src/lexicon/internal/HumanRide";
import {
  humanBicycleEffortTimeline
} from "../../../../../packages/motions/src/lexicon/internal/humanBicycleEffortTimeline";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanBicycleEffort` law's timeline (`humanBicycleEffortTimeline`): the
 * rider rises off the seat no sooner than the ride's take, stands, lowers and
 * sits again within the effort, cued in that order.
 *
 * Scenarios:
 *
 * 1. Over 4 s, off the seat at 1 s, standing at 1.5 s, lowering at 3 s and seated
 *    at 3.5 s, the cues fall at 0.25, 0.375, 0.75 and 0.875.
 * 2. Standing before leaving the seat is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines normalized timeline cues for rising, standing, lowering and reseating in the animated effort.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares a four-second effort with the authored transition times and tries standing before leaving the seat.
 * @evidence contracts/development/testing.md#independent-expectations Dividing the four times by duration gives 0.25, 0.375, 0.75 and 0.875, while reversed transitions are refused.
 */
export function test_motions_lexicon_bicycle_effort(): void {
  const timeline: Parameters<typeof humanBicycleEffortTimeline>[0] = {
    duration: 4,
    seatOff: 1,
    up: 1.5,
    lower: 3,
    seatOn: 3.5,
    lift: 0.1,
  };
  TestValidator.equals(
    "the effort's cues",
    humanBicycleEffortTimeline(timeline).map(
      (e: IAutoMovieMotionEvent): string => e.name,
    ),
    ["seatOff", "standing", "lower", "seatOn"],
  );
  TestValidator.predicate(
    "standing too soon",
    HumanRide.TAKE <= 1 &&
      humanBicycleEffortTimeline(timeline)[3]!.share === 0.875 &&
      throwsError(() => humanBicycleEffortTimeline({ ...timeline, up: 0.9 })),
  );
}
