import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "../../../scripts/human-viewer/serializeHumanViewerAddress";

/**
 * Shadow selection is display state shared by HTTP capture and bookmarks.
 * Scenarios:
 * 1. An absent shadow field preserves the existing enabled-light behavior.
 * 2. Explicit on/off survives canonical serialization and hash/query parsing.
 * 3. Shadow changes preserve the selected numerical document and AO state.
 */
export function test_human_viewer_shadows_address(): void {
  const baseline = parseHumanViewerAddress("doc=body:neutral&ao=off");
  TestValidator.equals("existing default", baseline.shadows, true);
  for (const enabled of [true, false]) {
    const selected = { ...baseline, shadows: enabled };
    const query = serializeHumanViewerAddress(selected);
    TestValidator.equals("encoded shadow", new URLSearchParams(query).get("shadows"), enabled ? "on" : "off");
    TestValidator.equals("hash shadow roundtrip", parseHumanViewerAddress("#" + query), selected);
    TestValidator.equals("HTTP shadow roundtrip", parseHumanViewerAddress("?" + query), selected);
    TestValidator.equals("document preserved", selected.doc, baseline.doc);
    TestValidator.equals("AO preserved", selected.ao, baseline.ao);
  }
}
