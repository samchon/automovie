import type { IHumanShotContext } from "./IHumanShotContext.js";
import type { IHumanViewerProbe } from "./IHumanViewerProbe.js";
import { killHumanViewerProcess } from "./killHumanViewerProcess.js";
import { readHumanViewerRecord } from "./readHumanViewerRecord.js";

/**
 * Stop this checkout's viewer on the port: only when the answering server
 * reports the pid this port's record names and its recorded OS creation stamp
 * identifies the live process, so a server another session or
 * checkout owns, a stale record and a busy port are all refused and never
 * killed. An absent viewer is reported, not an error. The terminated owner's
 * record remains, because deleting after the port is free could remove a
 * replacement owner's record. The next listener replaces it after binding.
 */
export function stopHumanViewerServer(
  context: IHumanShotContext,
  probe: IHumanViewerProbe,
): void {
  if (probe.health === null) {
    console.log("human-viewer absent");
    return;
  }
  if (probe.health === undefined)
    throw new Error("The port is busy; ownership cannot yet be verified");
  const saved = readHumanViewerRecord(context.record);
  if (saved === null || saved.pid !== probe.health.pid || saved.port !== context.port)
    throw new Error("The running server is not owned by this checkout");
  if (!saved.processStartedAt)
    throw new Error("The process record lacks a creation identity; stop refused");
  killHumanViewerProcess(saved.pid, saved.processStartedAt);
}
