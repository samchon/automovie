import { TestValidator } from "@nestia/e2e";

import { createHumanPersonFaceBuilder } from "@automovie/human/human/build/createHumanPersonFaceBuilder";
import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A person's current and reference faces retain separate actual hair identities.
 *
 * Scenarios:
 * 1. Two admitted populations return their own emitted sets; building the
 *    reference does not replace the previously returned current selection.
 * 2. Mutating a returned set cannot affect another result or a cached build.
 * 3. Omitted hair clears the selection; failed input returns no stale pair and
 *    a valid population recovers without changing the input document.
 */
export const test_human_person_face_hair_identity = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  document.hair!.layers[0].count = 1;
  document.hair!.layers[0].lengthAxes.fill(0.008);
  const before = structuredClone(document);
  const build = createHumanPersonFaceBuilder(basis);
  const current = build(document);
  TestValidator.equals("fixture current emission", current.model.parts.length, 2);
  const currentIds = current.model.parts.slice(1).map((part) => part.id);
  TestValidator.equals("current emitted set", [...current.hairPartIds], currentIds);
  const referenceDocument = structuredClone(document);
  referenceDocument.hair!.layers[0].id = "reference-population";
  const reference = build(referenceDocument);
  const referenceIds = reference.model.parts.slice(1).map((part) => part.id);
  TestValidator.predicate("different source populations emit different IDs", currentIds[0] !== referenceIds[0]);
  TestValidator.equals("reference emitted set", [...reference.hairPartIds], referenceIds);
  TestValidator.equals("reference build preserves current set", [...current.hairPartIds], currentIds);
  current.hairPartIds.clear();
  TestValidator.equals("returned sets are separately owned", [...reference.hairPartIds], referenceIds);
  const cached = build(document);
  TestValidator.equals("set mutation cannot alter cached emission", [...cached.hairPartIds], currentIds);
  TestValidator.equals("omitted hair has empty selection", [...build({ ...document, hair: undefined }).hairPartIds], []);
  const invalid = structuredClone(document);
  invalid.hair!.layers[0].domain = "absent";
  TestValidator.predicate("invalid face pair refuses", throwsError(() => build(invalid)));
  TestValidator.equals("valid pair recovers", [...build(document).hairPartIds], currentIds);
  TestValidator.equals("document remains owned", document, before);
};
