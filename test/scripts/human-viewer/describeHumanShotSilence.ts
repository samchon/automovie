import type { IHumanShotContext } from "./IHumanShotContext";
import type { IHumanViewerSilence } from "./IHumanViewerSilence";
import { describeHumanViewerSilence } from "./describeHumanViewerSilence";
import { isHumanViewerProcessAlive } from "./isHumanViewerProcessAlive";
import { readHumanViewerRecord } from "./readHumanViewerRecord";

/**
 * Describe a port that gave no health answer, with this port's process record
 * and whether that process is alive. Refused and unanswered are different
 * facts: an unanswered port has a live listener, and starting another server
 * on it would contend.
 *
 * @evidence contracts/common.md#principled-implementation Reports absent and unanswered as different outcomes, with the recorded owner.
 * @evidence contracts/common.md#meaningful-documentation States the two outcomes.
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
