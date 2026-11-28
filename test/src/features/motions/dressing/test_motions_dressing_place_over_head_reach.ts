import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";

/** The horizontal shoulder-to-apex gap after the greatest clear step, metres. */
const GAP: number = 0.65;

/** The apex height above the standing shoulder, metres. */
const HEIGHT: number = 0.32;

/**
 * Check which body can reach the reconstructed over-head placement point.
 *
 * Scenarios:
 *
 * 1. Over the allowed approach in the small body's fixture, the 0.85 m
 *    forward and 0.32 m raised target remains beyond her arm even as she
 *    leans.
 * 2. Apply the same layout and minimum foot-to-seat spacing to an average
 *    man's body. At some lean the target is within arm length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases state the fixed clearance, target and differing body measurements.
 * @evidence contracts/development/testing.md#behavioral-verification The test compares the minimum target distance from the two measured bodies over the examined lean range.
 * @evidence contracts/development/testing.md#independent-expectations Shoulder translation follows trunk length times sine and the vertical cosine loss. Upper arm and forearm lengths supply the reach.
 */
export async function test_motions_dressing_place_over_head_reach(): Promise<void> {
  const nearest = (measure: IAutoMovieBodyMeasure): number => {
    const trunk: number = measure.shoulderHeight - measure.hipHeight;

    // Viewed from the hip, the target lies inside the first quadrant. Its
    // nearest shoulder on the quarter circle is on the same ray.
    return Math.hypot(GAP, HEIGHT + trunk) - trunk;
  };
  const small: IAutoMovieBodyMeasure = (await humanFixture("f-small")).measure;
  const reach = (measure: IAutoMovieBodyMeasure): number =>
    measure.upperArm + measure.forearm;
  TestValidator.predicate(
    "out of the small woman's reach at every hinge",
    nearest(small) > reach(small),
  );
  const average: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
  TestValidator.predicate(
    "within the average man's",
    nearest(average) <= reach(average),
  );
}
