import {
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Compact basis edits round-trip without photos, geometry payloads or lossy JSON numbers.
 *
 * Scenarios:
 * 1. Signed shape, expression and independent appearance fields survive exact replay.
 * 2. Unknown/missing fields, nonfinite values, malformed JSON and blank IDs refuse.
 * 3. The size endpoint is accepted and one additional code unit refuses.
 */
export const test_subject_human_basis_document = (): void => {
  const { document } = humanFaceBasisFixture();
  document.shape.width = -0.25;
  document.expression.lift = 0.5;
  document.materials = {
    skin: { color: { r: 0, g: 0.5, b: 1 }, roughness: 0 },
    lips: {},
  };
  const text = serializeHumanFaceBasisDocument(document);
  const parsed = parseHumanFaceBasisDocument(text);
  TestValidator.equals("complete round trip", parsed, document);
  parsed.shape.width = 1;
  TestValidator.equals("parse ownership", document.shape.width, -0.25);
  for (const patch of [
    { version: "bad" },
    { id: "" },
    { name: " " },
    { basis: "" },
    { extra: true },
    { expression: null },
    { materials: { skin: { unknown: 1 } } },
  ])
    TestValidator.predicate(
      "schema refusal",
      throwsError(() =>
        parseHumanFaceBasisDocument(JSON.stringify({ ...document, ...patch })),
      ),
    );
  for (const field of ["shape", "expression"] as const) {
    const invalid = structuredClone(document);
    invalid[field].invalid = Infinity;
    TestValidator.predicate(
      "nonfinite save refusal",
      throwsError(() => serializeHumanFaceBasisDocument(invalid)),
    );
  }
  TestValidator.predicate(
    "overflowed JSON number",
    throwsError(() =>
      parseHumanFaceBasisDocument(
        text.replace('"width": -0.25', '"width": 1e999'),
      ),
    ),
  );
  TestValidator.predicate(
    "malformed JSON",
    throwsError(() => parseHumanFaceBasisDocument("{")),
  );
  const plain = humanFaceBasisFixture().document;
  TestValidator.equals(
    "omitted appearance",
    parseHumanFaceBasisDocument(serializeHumanFaceBasisDocument(plain)),
    plain,
  );
  TestValidator.equals(
    "exact size endpoint",
    parseHumanFaceBasisDocument(
      " ".repeat(16 * 1024 * 1024 - text.length) + text,
    ),
    document,
  );
  TestValidator.predicate(
    "size guard",
    throwsError(() =>
      parseHumanFaceBasisDocument(" ".repeat(16 * 1024 * 1024 + 1)),
    ),
  );
};
