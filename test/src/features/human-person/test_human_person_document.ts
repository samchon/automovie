import {
  type IAutoMovieHumanPersonDocument,
  parseHumanPersonDocument,
  serializeHumanPersonDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A person document saves and loads through the two anatomies' own admission.
 *
 * Scenarios:
 * 1. A document survives serialize then parse unchanged.
 * 2. An unknown field, an empty person identity, a nonfinite face value, a
 *    nonfinite body value and text past the shared envelope, on load or on
 *    save, each refuse.
 * 3. Text that is not JSON refuses.
 */
export const test_human_person_document = (): void => {
  const document: IAutoMovieHumanPersonDocument = {
    id: "p",
    name: "A person",
    face: {
      id: "f",
      name: "f",
      basis: "face/1",
      shape: { headWidth: 0.25 },
      expression: {},
    },
    body: { id: "b", name: "b", basis: "body/1", shape: { macroHeight: -0.5 } },
  };
  TestValidator.equals(
    "a document round-trips",
    parseHumanPersonDocument(serializeHumanPersonDocument(document)),
    document,
  );

  const refuses = (text: string): boolean =>
    throwsError(() => parseHumanPersonDocument(text));
  TestValidator.predicate(
    "an unknown field refuses",
    refuses(JSON.stringify({ ...document, extra: 1 })),
  );
  TestValidator.predicate(
    "an empty identity refuses",
    refuses(JSON.stringify({ ...document, id: " " })),
  );
  TestValidator.predicate(
    "a nonfinite face value refuses on save",
    throwsError(() =>
      serializeHumanPersonDocument({
        ...document,
        face: { ...document.face, shape: { headWidth: Number.NaN } },
      }),
    ),
  );
  TestValidator.predicate(
    "a nonfinite body value refuses on save",
    throwsError(() =>
      serializeHumanPersonDocument({
        ...document,
        body: { ...document.body, shape: { macroHeight: Infinity } },
      }),
    ),
  );
  TestValidator.predicate(
    "text past the envelope refuses",
    throwsError(
      () => parseHumanPersonDocument(" ".repeat(16 * 1024 * 1024 + 1)),
      "16,777,216",
    ),
  );
  TestValidator.predicate(
    "a document too large to load refuses on save",
    throwsError(
      () =>
        serializeHumanPersonDocument({
          ...document,
          name: "x".repeat(16 * 1024 * 1024 + 1),
        }),
      "16,777,216",
    ),
  );
  TestValidator.predicate("text that is not JSON refuses", refuses("{"));
};
