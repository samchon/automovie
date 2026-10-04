import { parseHumanBodyAnatomicalDocument } from "@automovie/human/body/document/parseHumanBodyAnatomicalDocument";
import { serializeHumanBodyAnatomicalDocument } from "@automovie/human/body/document/serializeHumanBodyAnatomicalDocument";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { throwsError } from "../internal/predicates";

/**
 * The shared parser/saver envelope counts actual escaped UTF-16 text.
 *
 * Scenarios:
 * 1. Oversized parser input and escape-expanded saver output refuse at the shared UTF-16 envelope.
 * 2. An ordinary complete request still roundtrips after both refusals.
 */
export function test_human_body_anatomical_text_budget(): void {
  const { document } = bodyAnatomicalInspectionFixture();
  TestValidator.predicate("oversized text refused before parse", throwsError(() => parseHumanBodyAnatomicalDocument(" ".repeat(16 * 1024 * 1024 + 1)), "16,777,216"));
  // A valid label's escapes can exceed the serialized envelope before its raw length does.
  TestValidator.predicate("escaped save cannot exceed reload envelope", throwsError(() => serializeHumanBodyAnatomicalDocument({ ...document, name: "label" + "\n".repeat(8 * 1024 * 1024 + 1) }), "16,777,216"));
  TestValidator.equals("ordinary recovery remains canonical", parseHumanBodyAnatomicalDocument(serializeHumanBodyAnatomicalDocument(document)), document);
}
