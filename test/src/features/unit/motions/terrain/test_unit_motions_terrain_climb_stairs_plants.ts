import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  climbStairsPlants,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `climbStairsPlants` plants each foot of a stair climb between its swings:
 * from the tread contact that brings it to a print to the next toe-off that
 * leaves it, on the floor at level 0 and on the flight above it, a flight on a
 * named prop bearing on that prop.
 *
 * Scenarios, a 2 s climb (toe-off 0.2 s, tread contact 1 s) whose right foot
 * steps from the floor to level 1 of a flight of 0.17 m risers rising from 0.05
 * m, the left foot staying on the floor:
 *
 * 1. The left foot bears on the floor over the whole climb.
 * 2. The right foot bears on the floor until 0.1 of the climb, then from 0.5 on
 *    the flight at 0.05 + 0.17 = 0.22 m.
 * 3. On a prop named `deck` the right foot's second plant bears on it.
 */
export function test_unit_motions_terrain_climb_stairs_plants(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
    { name: "toeOff1", seconds: 0.2 },
    { name: "treadContact1", seconds: 1 },
  ]);
  const prints: Parameters<typeof climbStairsPlants>[0] = {
    left: [{ print: { level: 0 }, step: 0 }],
    right: [
      { print: { level: 0 }, step: 0 },
      { print: { level: 1 }, step: 1 },
    ],
  };
  const fixed: IAutoMovieMotionHumanContactWindow[] = climbStairsPlants(
    prints,
    clock,
    2,
    { floor: 0.05, riser: 0.17, sign: 1 },
  );
  TestValidator.equals(
    "the plants",
    fixed.map((w: IAutoMovieMotionHumanContactWindow): unknown[] => [
      w.part,
      w.from,
      w.to,
      w.support,
    ]),
    [
      ["leftFoot", 0, 1, { kind: "ground" }],
      ["rightFoot", 0, 0.1, { kind: "ground" }],
      ["rightFoot", 0.5, 1, { kind: "ground", height: 0.05 + 0.17 }],
    ],
  );
  const carried: IAutoMovieMotionHumanContactWindow[] = climbStairsPlants(
    prints,
    clock,
    2,
    { floor: 0.05, riser: 0.17, sign: 1, on: "deck" },
  );
  TestValidator.equals("on a prop", carried[2]!.support, {
    kind: "prop",
    subject: "deck",
  });
}
