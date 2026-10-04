import type { IHumanViewerSilence } from "./IHumanViewerSilence";
import type { IHumanViewerSilenceFacts } from "./IHumanViewerSilenceFacts";

/**
 * Say what a missing health answer means. A refused connection is an absent
 * viewer, which `ensure` may start. A connection that was accepted but not
 * answered within the probe has a listener, usually a live viewer whose event
 * loop is busy, and starting another one on the same port would only contend
 * for it; the recorded pid and its liveness say whose listener it probably is.
 * The module has no runtime imports and uses only syntax Node strips, so the
 * plain-Node control script can load it.
 *
 * @evidence contracts/common.md#principled-implementation The connection outcome, not the elapsed time alone, separates an absent viewer from a slow one.
 * @evidence contracts/common.md#clear-and-simple-design One pure description serves `human-shot status` and the control script.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reinterpret silence as readiness or as absence.
 * @evidence contracts/common.md#meaningful-documentation States what each outcome allows and why the module is import-free.
 */
export function describeHumanViewerSilence(facts: IHumanViewerSilenceFacts): IHumanViewerSilence {
  const owner = facts.recordedPid === null
    ? "no process record for this port"
    : `recorded pid ${facts.recordedPid} ${facts.recordedAlive ? "is alive" : "is gone"}`;
  return {
    ready: false,
    answer: facts.refused ? "absent" : "unanswered",
    port: facts.port,
    probeMs: facts.probeMs,
    recordedPid: facts.recordedPid,
    recordedAlive: facts.recordedAlive,
    meaning: facts.refused
      ? `Nothing listens on port ${facts.port}; ensure may start a viewer (${owner})`
      : `Port ${facts.port} accepted the connection but /health did not answer within ${facts.probeMs} ms; something listens there, usually a busy viewer, so do not start another viewer on this port (${owner})`,
  };
}
