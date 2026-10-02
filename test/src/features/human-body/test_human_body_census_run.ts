import { TestValidator } from "@nestia/e2e";

import { runBodyPoseDefectCensus } from "../../../scripts/body-basis/runBodyPoseDefectCensus";
import { bodyPoseCensusFixture } from "../internal/bodyPoseCensusFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A census measures each pose against its shape's rest and retains refusals.
 *
 * Scenarios:
 * 1. A cube doubled at pose has four times its area and eight times its volume;
 *    documents carry the same basis/shape and pose controls, preserving callers.
 * 2. A refused rest records every requested pose; a pose refusal records its
 *    cause without inventing a measurement. Error and RangeError causes survive.
 * 3. Unknown shape and pose names refuse before they can masquerade as anatomy.
 * 4. An empty selection completes without creating a row.
 */
export const test_human_body_census_run = (): void => {
  const fixture = bodyPoseCensusFixture();
  const before = structuredClone(fixture.input.states);
  const originalBuild = fixture.input.build;
  fixture.input.build = (document) => {
    const positions = originalBuild(document);
    document.shape.width = 999;
    if (document.pose !== undefined) document.pose[0].flexion = 999;
    return positions;
  };
  const rows = runBodyPoseDefectCensus(fixture.input);
  TestValidator.equals("one measured pair", rows.length, 1);
  TestValidator.predicate(
    "the pose is compared to the same shaped cube",
    rows[0].defects !== null && nclose(rows[0].defects.areaRatio, 4) && nclose(rows[0].defects.volumeRatio, 8),
  );
  TestValidator.equals("caller states are retained", fixture.input.states, before);
  TestValidator.equals("document shapes stay independent", fixture.documents.map((one) => one.shape.width), [2, 2]);
  TestValidator.equals("the pose's declared rows reach the builder", fixture.documents[1].pose, before.double.pose);
  TestValidator.equals("one progress record", fixture.progress, ["base/double"]);

  for (const reason of [new Error("rest unavailable"), new RangeError("rest unavailable")]) {
    const refused = bodyPoseCensusFixture();
    refused.input.poses = ["double", "double"];
    refused.input.build = () => { throw reason; };
    const rejected = runBodyPoseDefectCensus(refused.input);
    TestValidator.equals("every rest-dependent pose is retained", rejected.length, 2);
    TestValidator.predicate("rest refusal is explicit", rejected.every((row) => row.defects === null && row.refused === "rest unavailable"));
  }
  const posed = bodyPoseCensusFixture();
  const build = posed.input.build;
  posed.input.build = (document) => {
    if (document.pose !== undefined) throw new Error("joint range");
    return build(document);
  };
  const rejectedPose = runBodyPoseDefectCensus(posed.input);
  TestValidator.equals("a pose refusal retains its cause", rejectedPose[0].refused, "joint range");
  TestValidator.equals("a refused pose has no measurement", rejectedPose[0].defects, null);

  for (const selection of ["shapes", "poses"] as const)
    for (const name of ["absent", "constructor"]) {
      const unknown = bodyPoseCensusFixture();
      unknown.input[selection] = [name];
      TestValidator.predicate("only own review states are selected", throwsError(() => runBodyPoseDefectCensus(unknown.input), "Unknown census review state"));
    }
  const empty = bodyPoseCensusFixture();
  empty.input.shapes = [];
  TestValidator.equals("empty selection has no rows", runBodyPoseDefectCensus(empty.input), []);
};
