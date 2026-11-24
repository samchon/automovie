import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { grappleFront } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";

/**
 * `grappleFront.head` is how far a body leaning forward from the hips by a
 * pitch carries its head's front ahead of them: the head centre's height above
 * the hips times the sine of the pitch, plus the head's radius.
 *
 * Scenarios:
 *
 * 1. Upright, the average man's head front is one head radius ahead.
 * 2. Leaning 90 degrees it is the head centre's whole height above the hips
 *    plus the radius.
 */
export async function test_unit_motions_grappling_grapple_front_head(): Promise<void> {
  const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
  TestValidator.predicate(
    "the head's front",
    nclose(grappleFront.head({ measure: m }, 0), m.headRadius, 1e-12) &&
      nclose(
        grappleFront.head({ measure: m }, 90),
        m.headHeight - m.headRadius - m.hipHeight + m.headRadius,
        1e-12,
      ),
  );
}
