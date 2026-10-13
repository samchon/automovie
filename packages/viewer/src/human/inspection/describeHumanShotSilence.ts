import type { IHumanShotContext } from "./IHumanShotContext.js";
import type { IHumanViewerSilence } from "./IHumanViewerSilence.js";
import { describeHumanViewerSilence } from "./describeHumanViewerSilence.js";
import { isHumanViewerProcessAlive } from "./isHumanViewerProcessAlive.js";
import { readHumanViewerRecord } from "./readHumanViewerRecord.js";

/**
 * Describe a port that gave no health answer, with this port's process record
 * and whether that process is alive. Refused and unanswered are different
 * facts: an unanswered port has a live listener, and starting another server
 * on it would contend.
 */
export function describeHumanShotSilence(
  context: IHumanShotContext,
  refused: boolean,
): IHumanViewerSilence {
  const saved = readHumanViewerRecord(context.record);
  return describeHumanViewerSilence({
    refused,
    port: context.port,
    probeMs: context.probeMs,
    recordedPid: saved?.pid ?? null,
    recordedAlive: saved !== null && isHumanViewerProcessAlive(saved.pid),
  });
}
