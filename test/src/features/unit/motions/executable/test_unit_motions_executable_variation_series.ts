import { VariationSeries } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The scenarios of `test_unit_motions_executable_variation_series_deviation`. */
namespace ScenarioVariationSeriesDeviation {
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
}

/** The scenarios of `test_unit_motions_executable_variation_series_dispersion`. */
namespace ScenarioVariationSeriesDispersion {
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
}

/**
 * The `variation_series` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_variation_series(): void {
  ScenarioVariationSeriesDeviation.test_unit_motions_executable_variation_series_deviation();
  ScenarioVariationSeriesDispersion.test_unit_motions_executable_variation_series_dispersion();
}
