import {
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Every successfully saved compact edit must fit the loader's text envelope.
 * This pure serialization case uses the public 16 Mi UTF-16 limit and JSON's
 * escaping rules; it neither loads a mesh nor depends on a portrait fixture.
 *
 * Scenarios:
 * 1. A serialized document exactly at the limit loads with its name intact.
 * 2. One extra code unit refuses during save, before producing an unusable file.
 * 3. A newline's two-code-unit JSON escape also exceeds the serialized limit.
 */
export const test_subject_human_basis_save_boundary = (): void => {
  const { document } = humanFaceBasisFixture();
  const limit = 16 * 1024 * 1024;
  const overhead = JSON.stringify({ ...document, name: "" }, null, 2).length;
  document.name = "a".repeat(limit - overhead);
  const saved = serializeHumanFaceBasisDocument(document);
  TestValidator.equals("serialized endpoint", saved.length, limit);
  TestValidator.equals(
    "saved endpoint loads",
    parseHumanFaceBasisDocument(saved).name,
    document.name,
  );
  for (const name of [document.name + "a", document.name.slice(1) + "\n"])
    TestValidator.predicate(
      "unloadable save refused",
      throwsError(() => serializeHumanFaceBasisDocument({ ...document, name })),
    );
};
