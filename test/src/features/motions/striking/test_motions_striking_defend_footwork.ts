import {
  defendFootwork
} from "../../../../../packages/motions/src/striking/internal/defendFootwork";
import { TestValidator } from "@nestia/e2e";

/**
 * A defence's footwork after a step (`defendFootwork.schedule`, `down`): a
 * landing foot touches down at the start or halfway through the movement,
 * whichever is later; a check by the bearing leg waits for that landing; a
 * checking leg is off the floor between its release and the end.
 *
 * Scenarios:
 *
 * 1. Starting at 0.1 s with a 0.6 s movement, the landing left foot touches down
 *    at 0.3 s; checking with the bearing right leg releases it at 0.3 s, with
 *    the left at the start.
 * 2. The left bears from 0.3 s; the checking right leg bears up to its release and
 *    again from the end at 1 s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains landing and release ordering in a virtual step with separate checking and bearing legs.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a step schedule at stated times, checks with each leg and samples support before release and after return.
 * @evidence contracts/development/testing.md#independent-expectations The declared 0.6 s movement puts the bearing transition at 0.3 s. The alternate leg releases at 0.1 s and the returning foot bears again at 1 s.
 */
export function test_motions_striking_defend_footwork(): void {
  const timing = { begin: 0.1, movement: 0.6 };
  const landing = { left: true, right: false };
  const bearing: defendFootwork.ISchedule = defendFootwork.schedule(
    timing,
    landing,
    "right",
    "right",
  );
  TestValidator.equals("the schedule", bearing, {
    touchdown: { left: 0.3, right: 0 },
    release: 0.3,
  });
  TestValidator.equals(
    "another leg checks",
    defendFootwork.schedule(timing, landing, "left", "right").release,
    0.1,
  );
  TestValidator.equals(
    "bearing",
    [
      defendFootwork.down("left", 0.2, bearing, "right", 1),
      defendFootwork.down("left", 0.3, bearing, "right", 1),
      defendFootwork.down("right", 0.2, bearing, "right", 1),
      defendFootwork.down("right", 0.5, bearing, "right", 1),
      defendFootwork.down("right", 1, bearing, "right", 1),
    ],
    [false, true, true, false, true],
  );
}
