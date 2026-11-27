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
 * The capture population: ANSUR 1988's measures (Gordon et al. 1989) under the
 * sex's multivariate normal, each end's drivers held at their deviates and the
 * rest at their conditional means inside the surveyed and declared bounds,
 * written into public Human inputs.
 *
 * ANSUR 1988's women stand 1629.37 mm (SD 63.604) and weigh 62.01 kg (SD
 * 8.351), correlated 0.5287, surveyed 1428 to 1870 mm and 41.3 to 96.7 kg; the
 * declared stature domain starts at 1450 mm. The 99th percentile deviate is
 * 2.326.
 *
 * Scenarios:
 *
 * 1. With stature one deviation above its mean, mass rises by `r sd` and its
 *    deviation narrows to `sd sqrt(1 - r^2)`.
 * 2. The women's stature is bounded by the domain's 1450 mm below and the survey's
 *    1870 mm above; mass, which no control declares, keeps the survey's
 *    extremes.
 * 3. The tall woman stands 2.326 SD up and weighs the regression's `62.01 + 0.5287
 *    · 8.351 · 2.326` kg.
 * 4. The average woman's inputs carry Deurenberg et al. (1991)'s fat percentage
 *    `1.2 · 23.3357 + 0.23 · 26.2 - 5.4` at her mean BMI and age, the cephalic
 *    index `100 breadth / length`, and ANSUR II's palm share 108.7 / 181.1 of
 *    her hand.
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
