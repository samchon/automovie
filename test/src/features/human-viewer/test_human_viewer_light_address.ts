import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "../../../scripts/human-viewer/serializeHumanViewerAddress";

/**
 * Inspection directions survive bookmarks without becoming numerical inputs.
 * Scenarios:
 * 1. An absent field is null and emits no override, including legacy Node addresses.
 * 2. Key/fill/rim accept signed raw vectors and retain them across hash/query transport.
 * 3. Camera, document and AO remain unchanged by an explicit light selection.
 */
export function test_human_viewer_light_address(): void {
  const plain = parseHumanViewerAddress("doc=body:neutral&ao=off&view=back");
  const { light, ...legacy } = plain;
  TestValidator.equals("default studio", light, null);
  TestValidator.equals("legacy encoding", serializeHumanViewerAddress(legacy), serializeHumanViewerAddress(plain));
  TestValidator.equals("no invented override", new URLSearchParams(serializeHumanViewerAddress(plain)).has("light"), false);
  for (const name of ["key", "fill", "rim"]) {
    const selected = parseHumanViewerAddress(`doc=body:neutral&ao=off&view=back&light=${name},0.5,-1.5,-1.25`);
    TestValidator.equals("raw direction", selected.light, { name, direction: [0.5, -1.5, -1.25] });
    TestValidator.equals("hash", parseHumanViewerAddress("#" + serializeHumanViewerAddress(selected)), selected);
    TestValidator.equals("query", parseHumanViewerAddress("?" + serializeHumanViewerAddress(selected)), selected);
    TestValidator.equals("camera and document preserved", [selected.doc, selected.ao, selected.view], [plain.doc, plain.ao, plain.view]);
  }
}
