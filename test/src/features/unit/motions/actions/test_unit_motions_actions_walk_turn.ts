import { WalkTurn } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few cubic products, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `WalkTurn` is a walk's heading through its knots as a monotone cubic Hermite
 * curve (Fritsch and Butland 1984): the heading rests at both ends and at any
 * knot where it reverses or stops, an inner knot otherwise taking the weighted
 * harmonic mean of its two slopes, and it holds the end headings outside.
 *
 * Scenarios:
 *
 * 1. Turning 90 degrees over the first second and then holding, the knot at 1 s
 *    rests: a quarter second in reads 90 (3/16 - 2/64) = 14.0625, half way 45.
 * 2. Turning 90 degrees over 1 s and then 180 more over 2 s, both slopes 90
 *    degrees a second, the knot at 1 s takes rate 90: at 1.5 s, u = 1/4 of a 2
 *    s span ending at rest, the heading is 0.84375 * 90 + 0.140625 * 2 * 90 +
 *    0.15625 * 270 = 143.4375.
 * 3. Before the first knot and after the last the end headings hold, and two knots
 *    at one second step the heading there: the earlier at the second, the later
 *    after it.
 */
export function test_unit_motions_actions_walk_turn(): void {
  const held: WalkTurn = new WalkTurn([
    { seconds: 0, yaw: 0 },
    { seconds: 1, yaw: 90 },
    { seconds: 2, yaw: 90 },
  ]);
  TestValidator.predicate(
    "a resting knot",
    nclose(held.at(0.25), 14.0625, ROUNDING) &&
      nclose(held.at(0.5), 45, ROUNDING) &&
      nclose(held.at(1.5), 90, ROUNDING),
  );
  const onward: WalkTurn = new WalkTurn([
    { seconds: 0, yaw: 0 },
    { seconds: 1, yaw: 90 },
    { seconds: 3, yaw: 270 },
  ]);
  TestValidator.predicate(
    "a passing knot",
    nclose(onward.at(1.5), 143.4375, ROUNDING),
  );
  const stepped: WalkTurn = new WalkTurn([
    { seconds: 0, yaw: 0 },
    { seconds: 1, yaw: 0 },
    { seconds: 1, yaw: 30 },
    { seconds: 2, yaw: 30 },
  ]);
  TestValidator.equals(
    "the ends",
    [onward.at(-1), onward.at(5), stepped.at(1), stepped.at(1.5)],
    [0, 270, 0, 30],
  );
}
