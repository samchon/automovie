import type { IAutoMovieHumanParameters } from "@automovie/interface";
import {
  HumanPopulationBuild
} from "../../../../../packages/motions/src/executable/population/HumanPopulationBuild";
import {
  HumanPopulationConditional
} from "../../../../../packages/motions/src/executable/population/HumanPopulationConditional";
import {
  HumanPopulationEnds
} from "../../../../../packages/motions/src/executable/population/HumanPopulationEnds";
import {
  HumanPopulationSurvey
} from "../../../../../packages/motions/src/executable/population/HumanPopulationSurvey";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** How near a closed form comes, mm, kg or a share: rounding only. */
const EXACT: number = 1e-6;

/**
 * Exercise the stock capture population from its survey model through the Human input fields. Condition female mass on stature, read the declared and surveyed bounds, then compare the tall and average cases with their independent formulas.
 *
 * The conditional case uses the ANSUR 1988 female means of 1629.37 mm and 62.01 kg, their standard deviations of 63.604 mm and 8.351 kg, and correlation 0.5287. The tall case fixes stature at 2.326 deviations above its mean. The average case checks body fat percentage, cephalic index and left palm length in the published Human input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the conditioning, bounds, tall measure and average parameter cases exercised by this runner entry.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the conditioning, end-limit, end-measure and parameter-build owners directly using a female stature deviation and the f-tall and f-average stock ends. Reads the resulting anatomy, head and left palm inputs from IAutoMovieHumanParameters.
 * @evidence contracts/development/testing.md#independent-expectations The correlation gives the bivariate mean shift and conditional spread. The stature bound intersects the declared floor with the surveyed maximum, while mass keeps its survey bounds. Tall stature and mass follow the specified normal deviate and survey moments. Average fat uses Deurenberg's BMI-and-age formula. Head breadth over length and the ANSUR II 108.7/181.1 palm share set the remaining expectations. The tolerances cover the rounded inputs and arithmetic.
 */
export function test_motions_executable_human_population(): void {
  // 1. The conditioning.
  const r: number = 0.5287;
  const taller: HumanPopulationConditional.IMoments =
    HumanPopulationConditional.moments(
      "female",
      new Map([[0, 1629.37 + 63.604]]),
      1,
    );
  TestValidator.predicate(
    "the bivariate regression",
    nclose(taller.mean, 62.01 + r * 8.351, 1e-9) &&
      nclose(taller.sd, 8.351 * Math.sqrt(1 - r * r), 1e-9),
  );

  // 2. The limits.
  const limits: [number, number, number][] =
    HumanPopulationEnds.limits("female");
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

  // 3. An end's measures.
  const find = (name: string): HumanPopulationEnds.IEnd =>
    HumanPopulationEnds.ENDS.find(
      (end: HumanPopulationEnds.IEnd): boolean => end.name === name,
    )!;
  const tall: Record<HumanPopulationSurvey.Variable, number> =
    HumanPopulationEnds.measures(find("f-tall"));
  TestValidator.predicate(
    "the 99th percentile stature and its regressed mass",
    nclose(tall.stature, 1629.37 + 2.326 * 63.604, EXACT) &&
      nclose(tall.mass, 62.01 + r * 8.351 * 2.326, EXACT),
  );

  // 4. The written inputs.
  const average: HumanPopulationEnds.IEnd = find("f-average");
  const x: Record<HumanPopulationSurvey.Variable, number> =
    HumanPopulationEnds.measures(average);
  const woman: IAutoMovieHumanParameters = HumanPopulationBuild.params(average);
  TestValidator.predicate(
    "the fat percentage, the cephalic index and the palm",
    nclose(
      woman.body.anatomy!.bodyFatPercentage!,
      1.2 * 23.3357 + 0.23 * 26.2 - 5.4,
      EXACT,
    ) &&
      nclose(
        woman.head.cephalicIndex,
        (100 * x.headBreadth) / x.headLength,
        1e-9,
      ) &&
      nclose(
        woman.extremities!.hands!.left.palmLength,
        (x.handLength * 108.7) / 181.1,
        1e-9,
      ),
  );
}
