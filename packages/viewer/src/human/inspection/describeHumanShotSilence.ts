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
 *
 * @evidence contracts/common.md#principled-implementation Reports absent and unanswered as different outcomes, with the recorded owner.
 * @evidence contracts/common.md#clear-and-simple-design Composes the existing record reader, process-liveness check and silence formatter without another startup policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswered probe remains listener evidence and never becomes permission to terminate or replace a process.
 * @evidence contracts/common.md#meaningful-documentation States the two outcomes.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Reports absent and unanswered as different outcomes, with the recorded owner.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Composes the existing record reader, process-liveness check and silence formatter without another startup policy.
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
