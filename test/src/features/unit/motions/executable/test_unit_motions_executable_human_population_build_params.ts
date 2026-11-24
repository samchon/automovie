import { AutoMovieHumanSex } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import {
  HumanPopulationBuild,
  HumanPopulationEnds,
  HumanPopulationSurvey,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** How near a written input comes to its closed form: rounding only. */
const EXACT: number = 1e-9;

/**
 * `HumanPopulationBuild.params` writes an end's surveyed measures into public
 * Human inputs: the sex, the directly measured fields, the fat percentage of
 * Deurenberg et al. (1991: `1.2 BMI + 0.23 age - 10.8 male - 5.4`) at ANSUR
 * 1988's mean age (26.2 years for women, 27.2 for men), the cephalic index `100
 * breadth / length`, and both hands' palm at ANSUR II's palm over hand length
 * (women 108.7 / 181.1).
 *
 * The average woman and man carry their sex's mean BMI, 23.3357 and 25.4194
 * kg/m2.
 *
 * Scenarios:
 *
 * 1. The woman is declared female at the mean stature, 1629.37 mm.
 * 2. Her fat percentage is `1.2 * 23.3357 + 0.23 * 26.2 - 5.4`; the man's is
 *    `1.2 * 25.4194 + 0.23 * 27.2 - 10.8 - 5.4`.
 * 3. Her cephalic index is her head breadth over length, and her palm the ANSUR
 *    II share of her hand, the same on both hands.
 */
export function test_unit_motions_executable_human_population_build_params(): void {
  const find = (name: string): HumanPopulationEnds.IEnd =>
    HumanPopulationEnds.ENDS.find(
      (end: HumanPopulationEnds.IEnd): boolean => end.name === name,
    )!;
  const end: HumanPopulationEnds.IEnd = find("f-average");
  const woman: IAutoMovieHumanParameters = HumanPopulationBuild.params(end);
  const man: IAutoMovieHumanParameters = HumanPopulationBuild.params(
    find("m-average"),
  );
  const x: Record<HumanPopulationSurvey.Variable, number> =
    HumanPopulationEnds.measures(end);

  // 1. Sex and stature.
  TestValidator.predicate(
    "a female at the mean stature",
    woman.body.anatomy?.sex === AutoMovieHumanSex.Female &&
      nclose(woman.body.anatomy.stature!, 1629.37, 1e-6),
  );

  // 2. Deurenberg's fat percentage.
  TestValidator.predicate(
    "the fat percentage of the mean BMI",
    nclose(
      woman.body.anatomy!.bodyFatPercentage!,
      1.2 * 23.3357 + 0.23 * 26.2 - 5.4,
      1e-6,
    ) &&
      nclose(
        man.body.anatomy!.bodyFatPercentage!,
        1.2 * 25.4194 + 0.23 * 27.2 - 10.8 - 5.4,
        1e-6,
      ),
  );

  // 3. Head and hands.
  const hands: NonNullable<
    NonNullable<IAutoMovieHumanParameters["extremities"]>["hands"]
  > = woman.extremities!.hands!;
  TestValidator.predicate(
    "the cephalic index and the palm",
    nclose(woman.head.cephalicIndex, (100 * x.headBreadth) / x.headLength, EXACT) &&
      nclose(hands.left.palmLength, (x.handLength * 108.7) / 181.1, EXACT) &&
      hands.right.palmLength === hands.left.palmLength,
  );
}
