import type { IAutoMovieHumanBodyMeasures } from "@automovie/interface";
import { HumanPopulationAccess, f1 } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPopulationAccess.measures` resolves a person's body measures: a
 * supplied measure is kept as given.
 *
 * Scenarios:
 *
 * 1. The reference woman's supplied stature, waist and hip come back unchanged.
 */
export function test_unit_motions_executable_human_population_measures(): void {
  const resolved: IAutoMovieHumanBodyMeasures =
    HumanPopulationAccess.measures(f1);
  TestValidator.equals(
    "the supplied measures",
    [resolved.stature, resolved.waistCircumference, resolved.hipCircumference],
    [1696.9285583496094, 673.6269910921733, 991.406328716076],
  );
}
