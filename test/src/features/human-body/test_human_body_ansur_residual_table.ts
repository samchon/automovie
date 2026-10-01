import { TestValidator } from "@nestia/e2e";

import { formatAnsurCensusTable } from "../../../scripts/body-ansur/formatAnsurCensusTable";
import { summariseAnsurResiduals } from "../../../scripts/body-ansur/summariseAnsurResiduals";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Residual bands report bias and scatter per thin-to-heavy run, and the table
 * marks which rows share ANSUR's definition.
 *
 * Scenarios:
 * 1. Six residuals 1..6 in two bands are runs 1,2,3 and 4,5,6: means 2 and 5,
 *    population sd sqrt(2/3) each.
 * 2. Seven residuals in three bands cut at floor(7b/3): sizes 2, 2 and 3.
 * 3. Zero bands, more bands than residuals, a fractional band count and a
 *    non-finite residual are refused.
 * 4. The table lists same and different definitions, rounded means and sds.
 */
export const test_human_body_ansur_residual_table = (): void => {
  const two = summariseAnsurResiduals([1, 2, 3, 4, 5, 6], 2);
  TestValidator.predicate(
    "means and scatter",
    nclose(two[0].mean, 2) &&
      nclose(two[1].mean, 5) &&
      nclose(two[0].sd, Math.sqrt(2 / 3)) &&
      nclose(two[1].sd, Math.sqrt(2 / 3)),
  );
  TestValidator.equals(
    "sizes of three bands over seven",
    summariseAnsurResiduals([1, 2, 3, 4, 5, 6, 7], 3).map((b) => b.count),
    [2, 2, 3],
  );
  for (const task of [
    () => summariseAnsurResiduals([1], 0),
    () => summariseAnsurResiduals([1], 2),
    () => summariseAnsurResiduals([1, 2], 1.5),
    () => summariseAnsurResiduals([1, Number.NaN], 1),
  ])
    TestValidator.predicate("refused", throwsError(task));
  TestValidator.equals(
    "table",
    formatAnsurCensusTable([
      {
        sex: "female",
        measure: "calf",
        sameDefinition: true,
        count: 6,
        bands: two,
      },
      {
        sex: "male",
        measure: "waist",
        sameDefinition: false,
        count: 6,
        bands: [{ count: 6, mean: -12.6, sd: 3.4 }],
      },
    ]),
    "| sex | measure | definition | n | thin to heavy: mean (sd) mm |\n" +
      "| --- | --- | --- | --- | --- |\n" +
      "| female | calf | same | 6 | 2 (1) / 5 (1) |\n" +
      "| male | waist | different | 6 | -13 (3) |\n",
  );
};
