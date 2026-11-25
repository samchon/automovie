import { nearestAngleAlias } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `nearestAngleAlias` picks the 360-degree alias of an angle that a range
 * admits, the one nearest the angle itself when several do, and otherwise the
 * alias nearest the range, the one below on a tie. A null range is [0, 0].
 *
 * Scenarios:
 *
 * 1. In [-90, 90]: 45 stays, 300 becomes -60.
 * 2. In [-400, 400], where 10 has three admitted aliases, 10 stays; 500 has 140
 *    and -220 admitted and takes 140, one turn away.
 * 3. In [10, 20], which admits no alias of 200: -160 is 170 below the range and
 *    200 is 180 above it, so -160; 195 has -165 and 195 at 175 either way, and
 *    the tie goes below; -190 is 200 below and its alias 170 is 150 above, so
 *    170.
 * 4. With a null range, 359 becomes -1, one degree from zero. An already admitted
 *    signed-zero endpoint keeps the original angle.
 */
export function test_engine_math_nearest_angle_alias(): void {
  TestValidator.equals(
    "the alias each range takes",
    [
      nearestAngleAlias(45, { min: -90, max: 90 }),
      nearestAngleAlias(300, { min: -90, max: 90 }),
      nearestAngleAlias(10, { min: -400, max: 400 }),
      nearestAngleAlias(500, { min: -400, max: 400 }),
      nearestAngleAlias(200, { min: 10, max: 20 }),
      nearestAngleAlias(195, { min: 10, max: 20 }),
      nearestAngleAlias(-190, { min: 10, max: 20 }),
      nearestAngleAlias(359, null),
    ],
    [45, -60, 10, 140, -160, -165, 170, -1],
  );
  TestValidator.predicate(
    "an admitted endpoint returns the input angle unchanged",
    Object.is(nearestAngleAlias(-0, null), -0),
  );
}
