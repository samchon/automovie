/**
 * Exercise one declared endpoint across the public scalar editor inventory.
 * Lower and upper boundary scenarios share this assertion procedure, while
 * ownership/inheritance scenarios exercise document state independently. The
 * input is a valid in-memory document; geometry construction is not needed to
 * prove immutable scalar admission. Metadata supplies the advertised envelope,
 * and the independent oracle is exact path storage plus adjacent refusal.
 */
import { humanFaceDetailChannels, setHumanFaceDetail } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "./humanFaceFixture";
import { throwsError } from "./predicates";

/**
 * Accept the inclusive endpoint, refuse the outward neighbor and a nonfinite
 * value, and retain the caller's full document. The caller supplies an outward
 * signed step and nonfinite sample for its selected end of the interval.
 */
export const assertHumanDetailBoundary = (
  boundary: "minimum" | "maximum",
  outwardStep: number,
  nonfinite: number,
): void => {
  const document = humanFaceFixture();
  const before = structuredClone(document);
  TestValidator.predicate(
    "nonempty scalar inventory",
    humanFaceDetailChannels.length > 0,
  );
  for (const definition of humanFaceDetailChannels) {
    const value = definition[boundary];
    const next = setHumanFaceDetail(document, definition.id, value);
    let actual: unknown = next.detail;
    for (const key of [definition.region, ...definition.path])
      actual = (actual as Record<string, unknown>)[key];
    TestValidator.equals(
      `${definition.id} inclusive ${boundary}`,
      actual,
      value,
    );
    for (const refused of [value + outwardStep, nonfinite])
      TestValidator.predicate(
        `${definition.id} outside ${boundary}`,
        throwsError(() => setHumanFaceDetail(document, definition.id, refused)),
      );
  }
  TestValidator.equals("boundary edits preserve caller", document, before);
};
