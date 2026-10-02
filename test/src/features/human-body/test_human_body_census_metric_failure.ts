import { TestValidator } from "@nestia/e2e";

import { runBodyPoseDefectCensus } from "../../../scripts/body-basis/runBodyPoseDefectCensus";
import { bodyPoseCensusFixture } from "../internal/bodyPoseCensusFixture";
import { nclose } from "../internal/predicates";

/**
 * A numerical measurement failure cannot become a builder-refused pose row.
 *
 * Scenarios:
 * 1. Rest and posed cube builds both succeed, but the zone classifier fails.
 *    Its exact Error must escape before publication or progress instead of
 *    being reported as a refusal by the successful builder.
 * 2. The adjacent valid classifier still measures the independently known
 *    doubled cube's area ratio four and volume ratio eight.
 */
export const test_human_body_census_metric_failure = (): void => {
  const failed = bodyPoseCensusFixture();
  const reason = new Error("zone measurement unavailable");
  failed.input.zoneOfVertex = () => { throw reason; };
  let caught: unknown;
  try {
    runBodyPoseDefectCensus(failed.input);
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.equals("both intended cube builds succeeded", failed.documents.length, 2);
  TestValidator.predicate("metric failure escapes instead of becoming a builder refusal", caught === reason);
  TestValidator.equals("a failed metric reports no progress", failed.progress.length, 0);

  const valid = bodyPoseCensusFixture();
  const rows = runBodyPoseDefectCensus(valid.input);
  TestValidator.predicate(
    "the adjacent valid measurement remains available",
    rows.length === 1 && rows[0].defects !== null && nclose(rows[0].defects.areaRatio, 4) && nclose(rows[0].defects.volumeRatio, 8),
  );
};
