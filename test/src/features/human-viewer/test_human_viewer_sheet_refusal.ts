import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { planHumanViewerSheet } from "../../../scripts/human-viewer/planHumanViewerSheet";

/**
 * Invalid axes and oversized products refuse before taking any frame.
 * Scenarios:
 * 1. Empty, unknown, repeated axes and missing documents refuse.
 * 2. A 512-cell boundary is admitted and its 513-cell neighbour refuses.
 */
export function test_human_viewer_sheet_refusal(): void {
  const base = parseHumanViewerAddress("");
  const refuse = (axes: string, documents: string[] = []): boolean => {
    try {
      planHumanViewerSheet(base, axes, documents);
      return false;
    } catch {
      return true;
    }
  };
  for (const axes of [
    "",
    "view",
    ":front",
    "view:",
    "view:front;view:left",
    "source:a",
    "view:front,",
    "pass:no",
    "subject:missing",
    "state:missing",
    "subject:*",
  ])
    TestValidator.predicate("refuses " + axes, refuse(axes));
  const documents = Array.from(
    { length: 513 },
    (_value, index) => "subject-" + index,
  );
  TestValidator.equals(
    "boundary",
    planHumanViewerSheet(base, "subject:*", documents.slice(0, 512)).length,
    512,
  );
  TestValidator.predicate("over limit", refuse("subject:*", documents));
}
