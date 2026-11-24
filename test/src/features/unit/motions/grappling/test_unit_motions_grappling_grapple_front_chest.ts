import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { grappleFront } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";

/**
 * `grappleFront.chest` is how far a body leaning forward from the hips by a
 * pitch carries its chest's front ahead of them: the chest's height above the
 * hips times the sine of the pitch, plus half the chest's depth.
 *
 * Scenarios:
 *
 * 1. Upright, the average man's chest front is half his chest depth ahead.
 * 2. Leaning 30 degrees it is half the chest's height above the hips further.
 */
export async function test_unit_motions_grappling_grapple_front_chest(): Promise<void> {
  const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
  TestValidator.predicate(
    "the chest's front",
    nclose(grappleFront.chest({ measure: m }, 0), m.chestDepth / 2, 1e-12) &&
      nclose(
        grappleFront.chest({ measure: m }, 30),
        (m.chestHeight - m.hipHeight) / 2 + m.chestDepth / 2,
        1e-12,
      ),
  );
}
