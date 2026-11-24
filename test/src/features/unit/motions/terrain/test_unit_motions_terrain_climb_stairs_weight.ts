import { climbStairsWeight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";

/** Rounding of one quotient of seconds and one quintic, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `climbStairsWeight` is the right foot's share of the body's weight on the
 * stairs: all of it while the left foot swings, none while the right does,
 * moved between the feet on the minimum-jerk share over each double support,
 * from and to a balanced half at the climb's two ends.
 *
 * Two steps: the left swings from 1 to 1.4 s, the right from 2 to 2.4 s, on a
 * 3-second clock.
 *
 * Scenarios:
 *
 * 1. At the start the feet share the weight.
 * 2. Half way to the first toe-off the right bears `0.5 + 0.5 s(1/2) = 0.75`.
 * 3. Through the left swing the right bears all.
 * 4. Half way through the double support after it, half.
 * 5. Through the right swing the right bears none, and at the end a half.
 */
export function test_unit_motions_terrain_climb_stairs_weight(): void {
  const right: (seconds: number) => number = climbStairsWeight(
    ["left", "right"],
    linearMotionClock(3, [
      { name: "toeOff1", seconds: 1 },
      { name: "treadContact1", seconds: 1.4 },
      { name: "toeOff2", seconds: 2 },
      { name: "treadContact2", seconds: 2.4 },
    ]),
  );
  TestValidator.predicate(
    "balanced at the start",
    nclose(right(0), 0.5, ROUNDING),
  );
  TestValidator.predicate(
    "half way to the first toe-off",
    nclose(right(0.5), 0.75, ROUNDING),
  );
  TestValidator.predicate(
    "the left swing",
    nclose(right(1), 1, ROUNDING) && nclose(right(1.2), 1, ROUNDING),
  );
  TestValidator.predicate(
    "half way through the double support",
    nclose(right(1.7), 0.5, ROUNDING),
  );
  TestValidator.predicate(
    "the right swing and the end",
    nclose(right(2.2), 0, ROUNDING) && nclose(right(3), 0.5, ROUNDING),
  );
}
