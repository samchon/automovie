import { TestValidator } from "@nestia/e2e";

import { humanViewerLightDocuments } from "../../../scripts/human-viewer/humanViewerLightDocuments";

/**
 * Light controls follow actual viewport domains instead of document spelling.
 * Scenarios:
 * 1. Empty catalogues expose no light controls.
 * 2. Body/Person ids are supported and Face ids are excluded, regardless of prefix.
 * 3. Mutating the returned set cannot change the caller's catalogue rows.
 */
export function test_human_viewer_light_documents(): void {
  TestValidator.equals("empty capability", [...humanViewerLightDocuments([])], []);
  const rows = [{ id: "unprefixed", domain: "body" as const }, { id: "body:actually-face", domain: "face" as const }, { id: "composed", domain: "person" as const }];
  const supported = humanViewerLightDocuments(rows);
  TestValidator.equals("declared domains", [...supported], ["unprefixed", "composed"]);
  supported.clear();
  TestValidator.equals("caller rows retained", rows.map((row) => row.id), ["unprefixed", "body:actually-face", "composed"]);
}
