import { TestValidator } from "@nestia/e2e";

import { facePopulationControls } from "../../../scripts/face-review/facePopulationFacts";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Population controls from recorded facts.
 * Scenarios:
 * 1. 25 years is 0, 13 years -1, 90 years 1, 65 years 40/65 and 19 years
 *    (18/48 - 1/2) / (1/4).
 * 2. A child under 13 is held at -1 and flagged.
 * 3. Female is -1, male 1, the recorded ancestry's share one; unrecorded
 *    facts set nothing.
 * 4. An age outside MakeHuman's 1 to 90 years refuses.
 */
export const test_subject_face_population_facts = (): void => {
  const age = (ageYears: number) =>
    facePopulationControls({ ageYears, sex: null, ancestry: null }).shape
      .globalAgeStructure!;
  TestValidator.predicate(
    "age mapping",
    nclose(age(25), 0, 1e-12) &&
      nclose(age(13), -1, 1e-12) &&
      nclose(age(90), 1, 1e-12) &&
      nclose(age(65), 40 / 65, 1e-12) &&
      nclose(age(19), (18 / 48 - 0.5) / 0.25, 1e-12),
  );
  const child = facePopulationControls({
    ageYears: 7,
    sex: null,
    ancestry: null,
  });
  TestValidator.predicate(
    "child held",
    child.ageHeld && child.shape.globalAgeStructure === -1,
  );
  TestValidator.equals(
    "sex and ancestry",
    [
      facePopulationControls({
        ageYears: null,
        sex: "female",
        ancestry: "asian",
      }).shape,
      facePopulationControls({
        ageYears: null,
        sex: "male",
        ancestry: "african",
      }).shape,
      facePopulationControls({ ageYears: null, sex: null, ancestry: null })
        .shape,
    ],
    [
      { globalSexualDimorphism: -1, asianAncestry: 1 },
      { globalSexualDimorphism: 1, africanAncestry: 1 },
      {},
    ],
  );
  TestValidator.predicate(
    "age range",
    throwsError(
      () =>
        facePopulationControls({ ageYears: 120, sex: null, ancestry: null }),
      "between 1 and 90",
    ),
  );
};
