import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * A malformed shadow choice cannot silently deliver a different diagnostic.
 * Scenarios:
 * 1. Empty, boolean, numeric, whitespace and wrong-case choices refuse.
 * 2. A repeated shadow field refuses even when both values are individually valid.
 */
export function test_human_viewer_shadows_refusal(): void {
  for (const query of ["shadows=", "shadows=true", "shadows=0", "shadows=ON", "shadows=%20on", "shadows=on&shadows=off"]) {
    let error = "";
    try {
      parseHumanViewerAddress(query);
    } catch (failure) {
      if (failure instanceof Error) error = failure.message;
    }
    TestValidator.equals("strict shadow refusal", error,
      query.includes("&") ? "Repeated display field: shadows" : "shadows must be on or off");
  }
}
