import {
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Save and load share pigment admission. Old named images cannot silently enter
 * the numerical schema, and JSON cannot convert nonfinite colours into null.
 *
 * Scenarios:
 * 1. Numeric fields survive a complete round trip without resource resolution.
 * 2. Image keys, invalid dimensions/colours and nonfinite values refuse.
 * 3. Null and empty pigmentation remain distinct authored representations.
 */
export const test_subject_human_pigmentation_document = (): void => {
  const { document } = humanFaceBasisFixture();
  const field = {
    name: "mark",
    center: [0, 0, 0] as [number, number, number],
    radius: [1, 2, 3] as [number, number, number],
    gain: [0.2, 0.4, 0.6] as [number, number, number],
    strength: 1,
  };
  const skins: (typeof document.skin)[] = [null, {}, { square: [field] }];
  for (const skin of skins) {
    const source = { ...document, skin };
    TestValidator.equals(
      "numeric round trip",
      parseHumanFaceBasisDocument(serializeHumanFaceBasisDocument(source)),
      source,
    );
  }
  TestValidator.predicate(
    "old image selector rejected",
    throwsError(() =>
      parseHumanFaceBasisDocument(
        JSON.stringify({ ...document, skin: "person" }),
      ),
    ),
  );
  for (const change of [
    { center: [Infinity, 0, 0] },
    { radius: [0, 1, 1] },
    { gain: [0, -0.1, 1] },
    { strength: NaN },
    { name: " " },
  ]) {
    const source = { ...document, skin: { square: [{ ...field, ...change }] } };
    TestValidator.predicate(
      "invalid in-memory pigment refuses",
      throwsError(() =>
        serializeHumanFaceBasisDocument(source as typeof document),
      ),
    );
    TestValidator.predicate(
      "invalid loaded pigment refuses",
      throwsError(() => parseHumanFaceBasisDocument(JSON.stringify(source))),
    );
  }
};
