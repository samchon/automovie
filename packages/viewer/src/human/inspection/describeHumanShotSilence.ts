import type { IHumanShotContext } from "./IHumanShotContext.js";
import type { IHumanViewerSilence } from "./IHumanViewerSilence.js";
import { describeHumanViewerSilence } from "./describeHumanViewerSilence.js";
import { isHumanViewerProcessAlive } from "./isHumanViewerProcessAlive.js";
import { readHumanViewerRecord } from "./readHumanViewerRecord.js";

/**
 * Join a missing health answer with this port's record and signal-zero process probe. A nonrefused failure supplies no absence proof and is insufficient authority to start a competing server; a process-probe failure can include access denial.
 *
 * @evidence contracts/common.md#principled-implementation The saved per-port process record and actual process-liveness check join the observed refusal flag in the existing silence classifier.
 * @evidence contracts/common.md#clear-and-simple-design This adapter supplies command context to the shared classifier rather than duplicating its failure/recovery wording.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recorded pid is not assumed alive and an unanswered health request is not automatically treated as a refused port.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes silence from refusal and explains why starting another server can contend with a live listener.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One record read and one liveness query select no input-sized computation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current process liveness must be observed for this diagnosis; a previous answer is not cached as current authority.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The adapter returns a diagnosis and retains no process handle, watcher or record cache.
 */
export function describeHumanShotSilence(
  context: IHumanShotContext,
  refused: boolean,
): IHumanViewerSilence {
  const saved: ReturnType<typeof readHumanViewerRecord> = readHumanViewerRecord(context.record);
  return describeHumanViewerSilence({
    refused,
    port: context.port,
    probeMs: context.probeMs,
    recordedPid: saved?.pid ?? null,
    recordedAlive: saved !== null && isHumanViewerProcessAlive(saved.pid),
  });
}
