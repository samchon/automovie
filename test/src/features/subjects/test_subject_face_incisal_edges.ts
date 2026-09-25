import { TestValidator } from "@nestia/e2e";

import { faceIncisalEdges } from "../../../scripts/face-review/faceIncisalEdges";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { throwsError } from "../internal/predicates";

/**
 * Incisal edges read from the crowns that hold the contact's incisal pair.
 * Scenarios:
 * 1. On the analytic contact basis the upper crown's lowest vertex (3) and
 *    the lower crown's highest (8) are the edges, also when the pair names
 *    the upper crown's side vertex (0) and the lower crown's (6).
 * 2. A basis without contact and a pair on one crown refuse.
 */
export const test_subject_face_incisal_edges = (): void => {
  const { basis } = humanFaceContactFixture();
  TestValidator.equals("edges", faceIncisalEdges(basis), {
    surface: "teeth",
    upper: 3,
    lower: 8,
  });
  const side = structuredClone(basis);
  side.contact!.incisors.upper = 0;
  side.contact!.incisors.lower = 6;
  TestValidator.equals("from side vertices", faceIncisalEdges(side), {
    surface: "teeth",
    upper: 3,
    lower: 8,
  });
  TestValidator.predicate(
    "no contact",
    throwsError(
      () => faceIncisalEdges({ ...basis, contact: undefined }),
      "contact basis",
    ),
  );
  const one = structuredClone(basis);
  one.contact!.incisors.lower = 0;
  TestValidator.predicate(
    "one crown",
    throwsError(() => faceIncisalEdges(one), "separate crowns"),
  );
};
