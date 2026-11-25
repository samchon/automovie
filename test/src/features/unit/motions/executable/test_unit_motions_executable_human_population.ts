import { AutoMovieHumanSex } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import {
  HumanPopulationBuild,
  HumanPopulationConditional,
  HumanPopulationEnds,
  HumanPopulationSurvey,
  MotionCapturePopulation,
  f1,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The scenarios of `test_unit_motions_executable_human_population`. */
namespace ScenarioHumanPopulation {
  /**
   * `HumanPopulation` of the capture harness (exported internally as
   * `MotionCapturePopulation`) joins the survey, the conditioning, the ends, the
   * builder and the audit.
   *
   * ANSUR 1988's women stand 1629.37 mm (SD 63.604) and weigh 62.01 kg (SD
   * 8.351); the declared stature domain starts at 1450 mm, under their surveyed
   * tallest of 1870 mm.
   *
   * Scenarios:
   *
   * 1. Mass is the second measure, and nothing known keeps its marginal.
   * 2. The average woman's measures and inputs stand at the mean stature.
   * 3. Her stature's limits are the domain's 1450 mm and the survey's 1870 mm.
   * 4. The reference woman's stature row passes, and a row outside fails.
   */
  export function test_unit_motions_executable_human_population(): void {
    // 1. Index and conditioning.
    const marginal: HumanPopulationConditional.IMoments =
      MotionCapturePopulation.conditional("female", new Map(), 1);
    TestValidator.predicate(
      "the second measure's marginal",
      MotionCapturePopulation.index("mass") === 1 &&
        nclose(marginal.mean, 62.01, 1e-9) &&
        nclose(marginal.sd, 8.351, 1e-9),
    );

    // 2. The average woman.
    const end: MotionCapturePopulation.IEnd = MotionCapturePopulation.ENDS.find(
      (e: MotionCapturePopulation.IEnd): boolean => e.name === "f-average",
    )!;
    const params: IAutoMovieHumanParameters =
      MotionCapturePopulation.params(end);
    TestValidator.predicate(
      "the mean stature",
      nclose(MotionCapturePopulation.measures(end).stature, 1629.37, 1e-6) &&
        nclose(params.body.anatomy!.stature!, 1629.37, 1e-6),
    );

    // 3. Limits.
    TestValidator.equals(
      "the stature's limits",
      MotionCapturePopulation.limits("female")[0],
      [0, 1450, 1870],
    );

    // 4. Audit.
    const rows: MotionCapturePopulation.IRow[] = MotionCapturePopulation.audit(
      "f1",
      "female",
      f1,
    );
    const stature: MotionCapturePopulation.IRow = rows.find(
      (row: MotionCapturePopulation.IRow): boolean =>
        row.site === "surveyed female range: stature (height)",
    )!;
    TestValidator.equals(
      "a stature inside passes, one outside fails",
      [
        MotionCapturePopulation.passes(stature),
        MotionCapturePopulation.passes({ ...stature, value: 1900 }),
      ],
      [true, false],
    );
  }
}

/**
 * The scenarios of
 * `test_unit_motions_executable_human_population_build_params`.
 */
namespace ScenarioHumanPopulationBuildParams {
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
   * 2. Her fat percentage is `1.2 * 23.3357 + 0.23 * 26.2 - 5.4`; the man's is `1.2
   *
   *    - 25.4194 + 0.23 * 27.2 - 10.8 - 5.4`.
   * 3. Her cephalic index is her head breadth over length, and her palm the ANSUR II
   *    share of her hand, the same on both hands.
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
      nclose(
        woman.head.cephalicIndex,
        (100 * x.headBreadth) / x.headLength,
        EXACT,
      ) &&
        nclose(hands.left.palmLength, (x.handLength * 108.7) / 181.1, EXACT) &&
        hands.right.palmLength === hands.left.palmLength,
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_conditional`. */
namespace ScenarioHumanPopulationConditional {
  /** How near a conditional moment comes to its closed form: rounding only. */
  const EXACT: number = 1e-9;

  /**
   * `HumanPopulationConditional.moments` conditions one surveyed measure on
   * others under the sex's multivariate normal: with one known measure `k` it is
   * the bivariate regression `mu_t + r sd_t / sd_k (v_k - mu_k)` with the
   * residual deviation `sd_t sqrt(1 - r^2)`, and with none it is the marginal.
   *
   * The female table of ANSUR 1988 (Gordon et al. 1989) gives stature 1629.37 mm
   * (SD 63.604), mass 62.01 kg (SD 8.351) and their correlation 0.5287.
   *
   * Scenarios:
   *
   * 1. `index` places stature first, mass second and the ear's protrusion last.
   * 2. With nothing known, mass takes its marginal mean and deviation.
   * 3. With stature one deviation above its mean, mass rises by `r sd` and its
   *    deviation narrows to `sd sqrt(1 - r^2)`.
   * 4. A stature at its mean leaves the mean unchanged but still narrows the
   *    deviation.
   */
  export function test_unit_motions_executable_human_population_conditional(): void {
    // 1. Indices.
    TestValidator.equals(
      "the survey order",
      [
        HumanPopulationConditional.index("stature"),
        HumanPopulationConditional.index("mass"),
        HumanPopulationConditional.index("earProtrusion"),
      ],
      [0, 1, 37],
    );

    // 2. The marginal.
    const marginal: HumanPopulationConditional.IMoments =
      HumanPopulationConditional.moments("female", new Map(), 1);
    TestValidator.predicate(
      "nothing known keeps the marginal",
      nclose(marginal.mean, 62.01, EXACT) && nclose(marginal.sd, 8.351, EXACT),
    );

    // 3. One deviation taller.
    const r: number = 0.5287;
    const taller: HumanPopulationConditional.IMoments =
      HumanPopulationConditional.moments(
        "female",
        new Map([[0, 1629.37 + 63.604]]),
        1,
      );
    TestValidator.predicate(
      "the bivariate regression",
      nclose(taller.mean, 62.01 + r * 8.351, EXACT) &&
        nclose(taller.sd, 8.351 * Math.sqrt(1 - r * r), EXACT),
    );

    // 4. At the mean.
    const average: HumanPopulationConditional.IMoments =
      HumanPopulationConditional.moments("female", new Map([[0, 1629.37]]), 1);
    TestValidator.predicate(
      "a mean stature keeps the mean mass",
      nclose(average.mean, 62.01, EXACT) &&
        nclose(average.sd, taller.sd, EXACT),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_ends_limits`. */
namespace ScenarioHumanPopulationEndsLimits {
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
}

/**
 * The scenarios of
 * `test_unit_motions_executable_human_population_ends_measures`.
 */
namespace ScenarioHumanPopulationEndsMeasures {
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
    const male: HumanPopulationSurvey.ISurvey =
      HumanPopulationSurvey.SURVEY.male;
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
}

/**
 * The `human_population` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_human_population(): void {
  ScenarioHumanPopulation.test_unit_motions_executable_human_population();
  ScenarioHumanPopulationBuildParams.test_unit_motions_executable_human_population_build_params();
  ScenarioHumanPopulationConditional.test_unit_motions_executable_human_population_conditional();
  ScenarioHumanPopulationEndsLimits.test_unit_motions_executable_human_population_ends_limits();
  ScenarioHumanPopulationEndsMeasures.test_unit_motions_executable_human_population_ends_measures();
}
