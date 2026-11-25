import { defendFootwork } from "@automovie/motions/internal";
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
 */
export function test_unit_motions_striking_defend_footwork(): void {
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
