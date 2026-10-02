import { TestValidator } from "@nestia/e2e";

import { planHumanViewerWatch } from "../../../scripts/human-viewer/planHumanViewerWatch";

/**
 * The watcher waits for a busy server and starts one only when none lives.
 *
 * Scenarios:
 * 1. An answering server is left alone whatever else is true.
 * 2. Silent with no live recorded process and no running child: start.
 * 3. Silent but the recorded process is alive, or the watcher's child runs:
 *    wait, until the silence passes the hang limit, then restart.
 */
export const test_human_viewer_watch_plan = (): void => {
  const base = { answered: false, recordedAlive: false, ownedRunning: false, silentMs: 0, limitMs: 1000 };
  TestValidator.equals("answering", planHumanViewerWatch({ ...base, answered: true, silentMs: 99999 }), "wait");
  TestValidator.equals("dead", planHumanViewerWatch({ ...base, silentMs: 99999 }), "start");
  TestValidator.equals("busy recorded pid", planHumanViewerWatch({ ...base, recordedAlive: true, silentMs: 500 }), "wait");
  TestValidator.equals("busy owned child", planHumanViewerWatch({ ...base, ownedRunning: true, silentMs: 1000 }), "wait");
  TestValidator.equals("hung recorded pid", planHumanViewerWatch({ ...base, recordedAlive: true, silentMs: 1001 }), "restart");
  TestValidator.equals("hung owned child", planHumanViewerWatch({ ...base, ownedRunning: true, silentMs: 5000 }), "restart");
};
