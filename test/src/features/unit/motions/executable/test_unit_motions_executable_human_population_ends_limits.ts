import {
  HumanPopulationConditional,
  HumanPopulationEnds,
  HumanPopulationSurvey,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPopulationEnds.limits` bounds each surveyed measure by its sex's
 * surveyed extremes, narrowed by the declared domain of the body control it
 * becomes.
 *
 * ANSUR 1988's women stand 1428 to 1870 mm and weigh 41.3 to 96.7 kg; the
 * declared stature domain is 1450 to 2000 mm, and mass has none.
 *
 * Scenarios:
 *
 * 1. Every measure is listed once, in the survey's order.
 * 2. The women's stature is narrowed below to the domain's 1450 mm and kept at the
 *    survey's 1870 mm above.
 * 3. Mass, which no control declares, keeps the surveyed extremes.
 * 4. No bound widens the surveyed range.
 */
export function test_unit_motions_executable_human_population_ends_limits(): void {
  const limits: [number, number, number][] =
    HumanPopulationEnds.limits("female");
  const survey: HumanPopulationSurvey.ISurvey =
    HumanPopulationSurvey.SURVEY.female;

  // 1. One row per measure.
  TestValidator.equals(
    "one row per measure in order",
    limits.map(([i]: [number, number, number]): number => i),
    HumanPopulationSurvey.VARIABLES.map((_v, i: number): number => i),
  );

  // 2. and 3. Stature and mass.
  TestValidator.equals(
    "stature narrowed, mass surveyed",
    [
      limits[HumanPopulationConditional.index("stature")],
      limits[HumanPopulationConditional.index("mass")],
    ],
    [
      [0, 1450, 1870],
      [1, 41.3, 96.7],
    ],
  );

  // 4. Never wider.
  TestValidator.predicate(
    "inside the surveyed range",
    limits.every(
      ([i, low, high]: [number, number, number]): boolean =>
        low >= survey.min[i]! && high <= survey.max[i]! && low <= high,
    ),
  );
}
