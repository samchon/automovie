import { TestValidator } from "@nestia/e2e";

import { runBodyPoseDefectCensus } from "../../../scripts/body-basis/runBodyPoseDefectCensus";
import { bodyPoseCensusFixture } from "../internal/bodyPoseCensusFixture";
import { throwsError } from "../internal/predicates";

/**
 * Input drift aborts a census outside the anatomical refusal handler.
 *
 * Scenarios:
 * 1. A source change before the first shape prevents every build.
 * 2. A changed basis after a pose aborts before reporting progress.
 * 3. A head change at the final publication check aborts despite a measured row.
 */
export const test_human_body_census_drift = (): void => {
  for (const changeAt of [1, 3, 4]) {
    const fixture = bodyPoseCensusFixture();
    const before = structuredClone(fixture.input.identity);
    let snapshots = 0;
    fixture.input.snapshot = () => {
      snapshots++;
      if (snapshots !== changeAt) return structuredClone(before);
      if (changeAt === 1) return { ...before, sourceSha256: "source-B" };
      if (changeAt === 3) return { ...before, basis: { ...before.basis, sha256: "payload-B" } };
      return { ...before, head: "revision-B" };
    };
    TestValidator.predicate(
      "a changed input aborts the entire table",
      throwsError(
        () => runBodyPoseDefectCensus(fixture.input),
        changeAt === 1
          ? "numerical source changed"
          : changeAt === 3
            ? "input basis changed"
            : "repository head changed",
      ),
    );
    TestValidator.equals("captured identity remains owned", fixture.input.identity, before);
    if (changeAt === 1) TestValidator.equals("source drift prevents build", fixture.documents.length, 0);
    if (changeAt === 3) TestValidator.equals("basis drift prevents progress", fixture.progress.length, 0);
    if (changeAt !== 1) TestValidator.equals("both rest and pose were arranged", fixture.documents.length, 2);
  }
};
