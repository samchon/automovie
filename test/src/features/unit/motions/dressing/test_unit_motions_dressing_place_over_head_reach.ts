import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";

/** The horizontal shoulder-to-apex gap after the greatest clear step, metres. */
const GAP: number = 0.65;

/** The apex height above the standing shoulder, metres. */
const HEIGHT: number = 0.32;

/**
 * Why `placeOverHeadStance` refuses the small woman setting a ribbon from in
 * front over the seated average man's head, her feet 0.3 m before his seat's
 * front edge: the layout is out of her reach for any stance, so the refusal is
 * the geometry's, not the adjustment step's.
 *
 * The hand's place at the loop's apex, as the stance reads it, lies 0.85 m
 * ahead of her standing shoulder and 0.32 m above it; his knees, at the seat's
 * front edge, keep her feet no nearer than 0.2 m on from where she enters, so
 * the place stays at least 0.65 m ahead. Her reach is her upper arm and forearm
 * (`placeOverHead`'s `reach`), her trunk the shoulder's height over the hip's.
 *
 * Scenarios:
 *
 * 1. Hinged at the hip by any angle from 0 to 90 degrees, her shoulder comes
 *    forward by `L sin θ` and down by `L (1 − cos θ)`, and its distance to the
 *    place never falls within her reach.
 * 2. The same layout is within the average man's own reach once he leans, so the
 *    bound is the small body's, not the layout's alone.
 */
export async function test_unit_motions_dressing_place_over_head_reach(): Promise<void> {
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
