import { VariationSeries } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `VariationSeries.dispersion` is the root mean square distance of points from
 * their mean.
 *
 * Scenarios:
 *
 * 1. Two points 2 m apart lie 1 m from their mean each: dispersion 1 m.
 * 2. The corners of a 2 m square in a plane lie `sqrt(2)` m from its centre.
 * 3. One point, or the same point repeated, has none.
 */
export function test_unit_motions_executable_variation_series_dispersion(): void {
  TestValidator.predicate(
    "the root mean square spread",
    nclose(
      VariationSeries.dispersion([
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
      ]),
      1,
      1e-12,
    ) &&
      nclose(
        VariationSeries.dispersion([
          { x: 1, y: 1, z: 3 },
          { x: -1, y: 1, z: 3 },
          { x: 1, y: -1, z: 3 },
          { x: -1, y: -1, z: 3 },
        ]),
        Math.SQRT2,
        1e-12,
      ) &&
      VariationSeries.dispersion([{ x: 2, y: 3, z: 4 }]) === 0 &&
      VariationSeries.dispersion([
        { x: 2, y: 3, z: 4 },
        { x: 2, y: 3, z: 4 },
      ]) === 0,
  );
}
