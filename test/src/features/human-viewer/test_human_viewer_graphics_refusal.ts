import { TestValidator } from "@nestia/e2e";
import { assertHumanViewerFrame } from "../../../scripts/human-viewer/assertHumanViewerFrame";

/**
 * A completed frame with a reported graphics error cannot be published.
 * Scenarios:
 * 1. The context's no-error reading is admitted.
 * 2. Invalid operation and out-of-memory readings refuse with their codes.
 */
export function test_human_viewer_graphics_refusal(): void {
  assertHumanViewerFrame(0, 0);
  for (const error of [0x0502, 0x0505]) {
    let message = "";
    try { assertHumanViewerFrame(error, 0); } catch (failure) { message = String(failure); }
    TestValidator.predicate("graphics refusal", message.includes(String(error)));
  }
}
