import {
  VariationSeries
} from "../../../../../packages/motions/src/executable/cases/VariationSeries";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The variation series' spread measures: the population standard deviation
 * `sqrt(mean((v - mean)^2))` and the root mean square distance of points from
 * their mean.
 *
 * Scenarios:
 *
 * 1. 2, 4, 4, 4, 5, 5, 7, 9 have the textbook deviation 2.
 * 2. The corners of a 2 m square lie `sqrt(2)` m from its centre.
 */
export function test_motions_executable_variation_series(): void {
  TestValidator.predicate(
    "the deviation and the dispersion",
    nclose(VariationSeries.deviation([2, 4, 4, 4, 5, 5, 7, 9]), 2, 1e-12) &&
      nclose(
        VariationSeries.dispersion([
          { x: 1, y: 1, z: 3 },
          { x: -1, y: 1, z: 3 },
          { x: 1, y: -1, z: 3 },
          { x: -1, y: -1, z: 3 },
        ]),
        Math.SQRT2,
        1e-12,
      ),
  );
}
