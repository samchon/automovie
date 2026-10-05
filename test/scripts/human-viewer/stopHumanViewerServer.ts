import fs from "node:fs";

import type { IHumanShotContext } from "./IHumanShotContext";
import type { IHumanViewerProbe } from "./IHumanViewerProbe";
import { killHumanViewerProcess } from "./killHumanViewerProcess";
import { readHumanViewerRecord } from "./readHumanViewerRecord";

/**
 * Stop this checkout's viewer on the port: only when the answering server
 * reports the pid this port's record names, so a server another session or
 * checkout owns, a stale record and a busy port are all refused and never
 * killed. An absent viewer is reported, not an error.
 *
 * @evidence contracts/common.md#principled-implementation Ownership is the equality of the recorded and the live pid.
 * @evidence contracts/common.md#meaningful-documentation States the refusals and the absent case.
 */
export function stopHumanViewerServer(context: IHumanShotContext, probe: IHumanViewerProbe): void {
  if (probe.health === null) {
    console.log("human-viewer absent");
    return;
  }
  if (probe.health === undefined) throw new Error("The port is busy; ownership cannot yet be verified");
  const saved = readHumanViewerRecord(context.record);
  if (saved === null || saved.pid !== probe.health.pid)
    throw new Error("The running server is not owned by this checkout");
  killHumanViewerProcess(saved.pid);
  fs.rmSync(context.record, { force: true });
}
