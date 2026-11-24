import type { IAutoMovieHumanParameters } from "@automovie/interface";
import {
  type HumanPopulationConditional,
  MotionCapturePopulation,
  f1,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
  const params: IAutoMovieHumanParameters = MotionCapturePopulation.params(end);
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
