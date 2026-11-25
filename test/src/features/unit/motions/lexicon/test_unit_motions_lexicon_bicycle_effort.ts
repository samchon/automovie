import { HumanRide, humanBicycleEffortTimeline } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The `HumanBicycleEffort` law's timeline (`humanBicycleEffortTimeline`): the
 * rider rises off the seat no sooner than the ride's take, stands, lowers and
 * sits again within the effort, cued in that order.
 *
 * Scenarios:
 *
 * 1. Over 4 s, off the seat at 1 s, standing at 1.5 s, lowering at 3 s and
 *    seated at 3.5 s, the cues fall at 0.25, 0.375, 0.75 and 0.875.
 * 2. Standing before leaving the seat is refused.
 */
export function test_unit_motions_lexicon_bicycle_effort(): void {
  const timeline = {
    duration: 4,
    seatOff: Math.max(1, HumanRide.TAKE),
    up: 1.5,
    lower: 3,
    seatOn: 3.5,
    lift: 0.1,
  };
  TestValidator.equals(
    "the effort's cues",
    humanBicycleEffortTimeline(timeline).map((e): string => e.name),
    ["seatOff", "standing", "lower", "seatOn"],
  );
  TestValidator.predicate(
    "standing too soon",
    HumanRide.TAKE <= 1 &&
      humanBicycleEffortTimeline(timeline)[3]!.share === 0.875 &&
      throwsError(() =>
        humanBicycleEffortTimeline({ ...timeline, up: 0.9 }),
      ),
  );
}