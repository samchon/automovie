import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "../../../scripts/human-viewer/serializeHumanViewerAddress";

/**
 * A bookmark and an HTTP query carry the same admitted display state.
 * Scenarios:
 * 1. Default state survives encoding without adding a reference or isolation.
 * 2. Every optional field and escaped document identity survives hash/query decoding.
 */
export function test_human_viewer_address_roundtrip(): void {
  const defaults = parseHumanViewerAddress("");
  TestValidator.equals("defaults", defaults, {
    doc: "connected-reference",
    parts: [],
    hide: [],
    zoom: 1,
    view: "front",
    pass: "beauty",
    frame: null,
    pitch: 0,
    look: null,
    ao: false,
    shadows: true,
    light: null,
    size: 900,
    ref: null,
    opacity: 0.5,
  });
  TestValidator.equals(
    "default roundtrip",
    parseHumanViewerAddress(serializeHumanViewerAddress(defaults)),
    defaults,
  );
  const selected = {
    ...defaults,
    doc: "body:subject & identity",
    parts: ["eye-left", "eye-right"],
    hide: ["hair", "skin"],
    zoom: 2.5,
    view: "left" as const,
    pass: "normal" as const,
    frame: [0, 0.1, -0.2, 0.04] as [number, number, number, number],
    pitch: -35.5,
    ao: true,
    size: 320,
    ref: "swipe" as const,
    opacity: 0.75,
  };
  const query = serializeHumanViewerAddress(selected);
  TestValidator.equals("hash", parseHumanViewerAddress("#" + query), selected);
  TestValidator.equals(
    "query",
    parseHumanViewerAddress("?" + query + "&fmt=png"),
    selected,
  );
}
