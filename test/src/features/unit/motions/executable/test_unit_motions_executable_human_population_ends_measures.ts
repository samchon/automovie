import {
  HumanPopulationConditional,
  HumanPopulationEnds,
  HumanPopulationSurvey,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** How near a measure comes to its closed form, mm or kg: rounding only. */
const EXACT: number = 1e-6;

/**
 * `HumanPopulationEnds.measures` holds an end's drivers at their deviates and
 * gives every other measure its conditional mean, held inside its bounds.
 *
 * The female ANSUR 1988 table gives stature 1629.37 mm (SD 63.604), mass 62.01
 * kg (SD 8.351), their correlation 0.5287 and the BMI 23.3357 kg/m2; the 99th
 * percentile deviate is 2.326.
 *
 * Scenarios:
 *
 * 1. The average woman stands at the mean stature with the mean BMI's mass at it,
 *    `23.3357 * 1.62937^2` kg.
 * 2. The tall woman stands 2.326 SD up, and her mass is the regression's `62.01 +
 *    0.5287 * 8.351 * 2.326` kg.
 * 3. The long-headed man's head length is the male mean plus 2.326 SD.
 * 4. Every measure the tall woman does not drive lies inside her sex's limits.
 */
export function test_unit_motions_executable_human_population_ends_measures(): void {
  const find = (name: string): HumanPopulationEnds.IEnd =>
    HumanPopulationEnds.ENDS.find(
      (end: HumanPopulationEnds.IEnd): boolean => end.name === name,
    )!;

  // 1. The average woman.
  const average: Record<HumanPopulationSurvey.Variable, number> =
    HumanPopulationEnds.measures(find("f-average"));
  TestValidator.predicate(
    "the mean stature and the mean BMI's mass",
    nclose(average.stature, 1629.37, EXACT) &&
      nclose(average.mass, 23.3357 * 1.62937 ** 2, EXACT),
  );

  // 2. The tall woman.
  const tall: Record<HumanPopulationSurvey.Variable, number> =
    HumanPopulationEnds.measures(find("f-tall"));
  TestValidator.predicate(
    "the 99th percentile stature and its regressed mass",
    nclose(tall.stature, 1629.37 + 2.326 * 63.604, EXACT) &&
      nclose(tall.mass, 62.01 + 0.5287 * 8.351 * 2.326, EXACT),
  );

  // 3. The long-headed man.
  const male: HumanPopulationSurvey.ISurvey = HumanPopulationSurvey.SURVEY.male;
  const head: number = HumanPopulationConditional.index("headLength");
  TestValidator.predicate(
    "the head length at its 99th percentile",
    nclose(
      HumanPopulationEnds.measures(find("m-long-head")).headLength,
      male.mean[head]! + 2.326 * male.sd[head]!,
      EXACT,
    ),
  );

  // 4. Inside the limits.
  TestValidator.predicate(
    "the conditioned measures inside their limits",
    HumanPopulationEnds.limits("female").every(
      ([i, low, high]: [number, number, number]): boolean => {
        const value: number = tall[HumanPopulationSurvey.VARIABLES[i]!];
        return i === 0 || (value >= low - EXACT && value <= high + EXACT);
      },
    ),
  );
}
