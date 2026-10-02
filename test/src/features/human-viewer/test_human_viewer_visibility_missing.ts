import { TestValidator } from "@nestia/e2e";

import { applyHumanViewerVisibility } from "../../../scripts/human-viewer/applyHumanViewerVisibility";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * An unknown isolation mesh refuses before hiding or drawing can proceed.
 * Scenarios:
 * 1. Product isolation reports two unknown names and both remain in the diagnostic.
 * 2. The later hiding transition is not executed after isolation refusal.
 */
export function test_human_viewer_visibility_missing(): void {
  let hidden = false;
  let error = "";
  try {
    applyHumanViewerVisibility({ setShadows: () => {}, observe: {
      pass: () => {}, isolate: () => ["missing-a", "missing-b"],
      hide: () => { hidden = true; return []; },
    } }, parseHumanViewerAddress("parts=missing-a,missing-b"));
  } catch (failure) {
    if (failure instanceof Error) error = failure.message;
  }
  TestValidator.equals("isolation diagnostic", error, "Unknown mesh: missing-a,missing-b");
  TestValidator.equals("hiding not reached", hidden, false);
}
