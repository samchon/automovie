import { TestValidator } from "@nestia/e2e";

import { planHumanViewerControl } from "../../../scripts/human-viewer/planHumanViewerControl";

/**
 * Status reports and stop acts on exactly the recorded, live-confirmed pid.
 *
 * Scenarios:
 * 1. Status exits 0 for a ready server, 3 for a not-ready, absent or busy one.
 * 2. Stop of an absent server reports absence; of a busy port is refused.
 * 3. Stop refuses a record that is missing or names another pid, and kills
 *    only when the record and the live server report the same pid.
 */
export const test_human_viewer_control_plan = (): void => {
  TestValidator.equals("ready", planHumanViewerControl("status", { pid: 1, ready: true }, null), { action: "report", exitCode: 0 });
  TestValidator.equals("warming", planHumanViewerControl("status", { pid: 1, ready: false }, null), { action: "report", exitCode: 3 });
  TestValidator.equals("absent status", planHumanViewerControl("status", null, null), { action: "report", exitCode: 3 });
  TestValidator.equals("busy status", planHumanViewerControl("status", undefined, null), { action: "report", exitCode: 3 });
  TestValidator.equals("absent stop", planHumanViewerControl("stop", null, { pid: 5 }), { action: "absent" });
  TestValidator.equals("busy stop", planHumanViewerControl("stop", undefined, { pid: 5 }), {
    action: "refuse",
    reason: "The port is busy; ownership cannot yet be verified",
  });
  const foreign = {
    action: "refuse",
    reason: "The running server is not owned by this checkout",
  } as const;
  TestValidator.equals("no record", planHumanViewerControl("stop", { pid: 7, ready: true }, null), foreign);
  TestValidator.equals("other pid", planHumanViewerControl("stop", { pid: 7, ready: true }, { pid: 5 }), foreign);
  TestValidator.equals("owned", planHumanViewerControl("stop", { pid: 7, ready: false }, { pid: 7 }), { action: "kill", pid: 7 });
};
