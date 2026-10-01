import { TestValidator } from "@nestia/e2e";

import { applyHumanViewerPose } from "../../../scripts/human-viewer/applyHumanViewerPose";
import { describeHumanViewerFailure } from "../../../scripts/human-viewer/describeHumanViewerFailure";

/**
 * A refusal names its cause and nothing local.
 *
 * Scenarios:
 * 1. A page error loses its automation prefix and stack frames.
 * 2. A plain one-line error is unchanged.
 * 3. An unreadable pose file refuses as an unknown pose file without the
 *    reader's path.
 */
export const test_human_viewer_failure_text = (): void => {
  TestValidator.equals("stack dropped",
    describeHumanViewerFailure("page.evaluate: Error: Unknown mesh: Nope\n    at show (http://127.0.0.1:5175/a.ts:1:1)"),
    "Unknown mesh: Nope");
  TestValidator.equals("plain", describeHumanViewerFailure("Invalid pitch"), "Invalid pitch");
  let message = "";
  try {
    applyHumanViewerPose(new URLSearchParams("pose=nofile:x"), () => {
      throw new Error("ENOENT: open a private local file");
    });
  } catch (error) {
    message = (error as Error).message;
  }
  TestValidator.equals("pose refusal", message, "Unknown pose file: nofile");
};
