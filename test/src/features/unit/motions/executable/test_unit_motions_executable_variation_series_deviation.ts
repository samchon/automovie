import { VariationSeries } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `VariationSeries.deviation` is the population standard deviation of values,
 * `sqrt(mean((v - mean)^2))`.
 *
 * Scenarios:
 *
 * 1. 1 and 3 deviate 1 from their mean 2.
 * 2. 2, 4, 4, 4, 5, 5, 7, 9 have the textbook deviation 2.
 * 3. Equal values have none.
 */
export function test_unit_motions_executable_variation_series_deviation(): void {
  TestValidator.predicate(
    "the population deviation",
    nclose(VariationSeries.deviation([1, 3]), 1, 1e-12) &&
      nclose(VariationSeries.deviation([2, 4, 4, 4, 5, 5, 7, 9]), 2, 1e-12) &&
      VariationSeries.deviation([5, 5, 5]) === 0,
  );
}
