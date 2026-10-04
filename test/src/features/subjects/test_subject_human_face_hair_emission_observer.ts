import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Hair observation reports the actual admitted emission, independently of
 * source-region membership or the hair producer's naming implementation.
 *
 * Scenarios:
 * 1. Construction reports an empty neutral; ordinary and certified builds
 *    report the generated model parts and preserve copied observer arrays.
 * 2. Omitted, null, empty and zero-count populations report [].
 * 3. Invalid input publishes nothing and a later valid cache hit recovers.
 */
export const test_subject_human_face_hair_emission_observer = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  document.hair!.layers[0].count = 1;
  document.hair!.layers[0].lengthAxes.fill(0.008);
  const observations: (readonly string[])[] = [];
  const build = createHumanFaceBasisBuilder(basis, {
    observeHairParts: (ids) => observations.push(ids),
  });
  TestValidator.equals("neutral bootstrap emission", observations, [[]]);
  const first = build(document);
  TestValidator.equals("fixture emits one hair part", first.parts.length, 2);
  const expected = first.parts.slice(1).map((part) => part.id);
  TestValidator.equals("ordinary emission identity", observations.at(-1), expected);
  (observations.at(-1)! as string[]).push("observer-owned-value");
  const cached = build(structuredClone(document));
  TestValidator.equals("certified emission identity", observations.at(-1), expected);
  TestValidator.equals("observer mutation cannot add a part", cached.parts.length, 2);
  TestValidator.equals("cached model identity", cached.parts.slice(1).map((part) => part.id), expected);

  const zero = structuredClone(document.hair!);
  zero.layers[0].count = 0;
  for (const hair of [undefined, null, { layers: [] }, zero]) {
    const model = build({ ...document, hair });
    TestValidator.equals("empty emission retains resident model", model.parts.length, 1);
    TestValidator.equals("empty emission observation", observations.at(-1), []);
  }
  const invalid = structuredClone(document);
  invalid.hair!.layers[0].domain = "absent";
  const count = observations.length;
  TestValidator.predicate("invalid domain refuses", throwsError(() => build(invalid)));
  TestValidator.equals("failed admission publishes nothing", observations.length, count);
  build(document);
  TestValidator.equals("valid emission recovers", observations.at(-1), expected);
  const collision = numericalHairBasisFixture();
  collision.document.hair = structuredClone(document.hair);
  collision.basis.surfaces[0].regions[0].id = expected[0];
  const refusedEmissions: (readonly string[])[] = [];
  const collide = createHumanFaceBasisBuilder(collision.basis, {
    observeHairParts: (ids) => refusedEmissions.push(ids),
  });
  TestValidator.predicate("resident/hair identity collision refuses", throwsError(() => collide(collision.document)));
  TestValidator.equals("failed composition publishes no emission", refusedEmissions, [[]]);
};
