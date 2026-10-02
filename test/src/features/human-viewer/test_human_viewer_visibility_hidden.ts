import { TestValidator } from "@nestia/e2e";

import { applyHumanViewerVisibility } from "../../../scripts/human-viewer/applyHumanViewerVisibility";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * An unknown hidden mesh also refuses before frame delivery.
 * Scenarios:
 * 1. Successful isolation does not suppress the subsequent hidden-mesh diagnostic.
 */
export function test_human_viewer_visibility_hidden(): void {
  let error = "";
  try {
    applyHumanViewerVisibility({ setShadows: () => {}, observe: {
      pass: () => {}, isolate: () => [], hide: () => ["missing"],
    } }, parseHumanViewerAddress("hide=missing"));
  } catch (failure) {
    if (failure instanceof Error) error = failure.message;
  }
  TestValidator.equals("hiding diagnostic", error, "Unknown mesh: missing");
}
