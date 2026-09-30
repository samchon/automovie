import { connectedFaceArticulationDegrees } from "@automovie/playground/src/human/face/anatomy/connectedFaceArticulationDegrees";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/** Physical display units are derived from selected source endpoints. */
export const test_subject_connected_articulation_degrees = (): void => {
  const basis = {
    articulation: {
      jaw: { opening: { channel: "jawOpen", degrees: 21.2 } },
      eyes: [
        {
          gaze: [
            { channel: "eyeLookInLeft", degrees: 14.8 },
            { channel: "eyeLookOutLeft", degrees: -14.3 },
          ],
        },
      ],
    },
  };
  TestValidator.equals(
    "mandibular endpoint degrees",
    connectedFaceArticulationDegrees(basis, "jawOpen"),
    21.2,
  );
  TestValidator.equals(
    "ocular endpoint degrees",
    connectedFaceArticulationDegrees(basis, "eyeLookInLeft"),
    14.8,
  );
  TestValidator.equals(
    "signed ocular endpoint",
    connectedFaceArticulationDegrees(basis, "eyeLookOutLeft"),
    -14.3,
  );
  TestValidator.equals(
    "other channels retain their source weight",
    connectedFaceArticulationDegrees(basis, "mouthSmileLeft"),
    null,
  );
  TestValidator.equals(
    "basis without articulation retains weights",
    connectedFaceArticulationDegrees({}, "jawOpen"),
    null,
  );
  for (const degrees of [0, Number.NaN, Infinity]) {
    const invalid = structuredClone(basis);
    invalid.articulation.eyes[0].gaze[0].degrees = degrees;
    TestValidator.predicate(
      "invalid angle refuses",
      throwsError(
        () => connectedFaceArticulationDegrees(invalid, "eyeLookInLeft"),
        "nonzero angle",
      ),
    );
  }
};
