import { GymnasticsWheelPlants } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A bearing window solves fixed contact knots before any playback queries.
 *
 * Scenarios:
 *
 * 1. A 1 to 2.25 s window on half-second spacing takes four solves, at 1, 1.5, 2
 *    and 2.25 s. The narrow final interval interpolates over 0.25 s and meets
 *    its exact final knot.
 * 2. Late, early, exact and repeated reads add no solves. A window with no elapsed
 *    time takes one solve and returns it on every read.
 */
export function test_unit_motions_sport_gymnastics_wheel_plant_keys(): void {
  const requests: number[] = [];
  const solve = (seconds: number): number => {
    requests.push(seconds);
    return seconds * seconds;
  };
  const sample: GymnasticsWheelPlants.Window<number> =
    GymnasticsWheelPlants.prepareWindow(1, 2.25, 0.5, solve);
  TestValidator.equals(
    "the finite knots are prepared immediately",
    requests,
    [1, 1.5, 2, 2.25],
  );
  TestValidator.equals(
    "sample at actual spacing, independently of order",
    [
      sample(2.125),
      sample(-1),
      sample(2.25),
      sample(1.25),
      sample(2),
      sample(2.125),
      sample(3),
    ],
    [
      [4, 5.0625, 0.5],
      [1, 1, 0],
      [5.0625, 5.0625, 0],
      [1, 2.25, 0.5],
      [4, 4, 0],
      [4, 5.0625, 0.5],
      [5.0625, 5.0625, 0],
    ],
  );
  TestValidator.equals(
    "playback creates no new solutions",
    requests,
    [1, 1.5, 2, 2.25],
  );
  const instant: GymnasticsWheelPlants.Window<number> =
    GymnasticsWheelPlants.prepareWindow(3, 3, 0.5, solve);
  TestValidator.equals(
    "the zero-length window has one immutable knot",
    [instant(2), instant(3), instant(4), requests],
    [
      [9, 9, 0],
      [9, 9, 0],
      [9, 9, 0],
      [1, 1.5, 2, 2.25, 3],
    ],
  );
}
