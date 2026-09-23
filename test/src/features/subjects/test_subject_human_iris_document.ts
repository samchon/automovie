import {
  createHumanFaceBasisBuilder,
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * The iris field travels through document admission and the builder.
 * Scenarios:
 * 1. A document with a valid pigment per eye parses and saves unchanged; a
 *    null iris also parses.
 * 2. A pigment whose band endpoint leaves the unit range refuses on load and
 *    on save, before any builder runs.
 * 3. On a basis without articulated eyes, a document without iris or with a
 *    null iris builds the identical model, while a document with pigments
 *    refuses by name instead of silently ignoring them.
 */
export const test_subject_human_iris_document = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const pigment = { base: [0.05, 0.02, 0.01], variation: [0.1, 0.05, 0.02] };
  const withIris = { ...document, iris: { left: pigment, right: pigment } };
  const text = serializeHumanFaceBasisDocument(withIris);
  TestValidator.equals(
    "round trip",
    parseHumanFaceBasisDocument(text),
    withIris,
  );
  TestValidator.equals(
    "null iris",
    parseHumanFaceBasisDocument(JSON.stringify({ ...document, iris: null }))
      .iris,
    null,
  );
  const invalid = {
    ...document,
    iris: {
      left: pigment,
      right: { base: [0.95, 0, 0], variation: [0.1, 0, 0] },
    },
  };
  TestValidator.predicate(
    "invalid pigment on load",
    throwsError(
      () => parseHumanFaceBasisDocument(JSON.stringify(invalid)),
      "unit-range",
    ),
  );
  TestValidator.predicate(
    "invalid pigment on save",
    throwsError(() => serializeHumanFaceBasisDocument(invalid), "unit-range"),
  );
  const build = createHumanFaceBasisBuilder(basis);
  TestValidator.equals(
    "null iris builds the same model",
    build({ ...document, iris: null }),
    build(document),
  );
  TestValidator.predicate(
    "pigment without articulated eyes",
    throwsError(() => build(withIris), "articulated eyes"),
  );
};
