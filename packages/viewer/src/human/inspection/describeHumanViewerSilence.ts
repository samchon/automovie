import type { IHumanViewerSilence } from "./IHumanViewerSilence.js";
import type { IHumanViewerSilenceFacts } from "./IHumanViewerSilenceFacts.js";

/**
 * Describe a missing health answer. ECONNREFUSED observes refusal during that probe and permits ensure to try startup. Other failures, including timeout, reset or an unreadable answer, provide no absence proof and therefore do not permit a competing startup. The recorded process probe is separate from listener ownership. Plain Node can load this module because its imports are type-only and its syntax is erasable.
 *
 * @evidence contracts/common.md#principled-implementation Actual refusal, probe interval and recorded process facts produce distinct absent/unanswered diagnoses and preserve those facts in the result.
 * @evidence contracts/common.md#clear-and-simple-design One owner description feeds both result alternatives without opening a socket or process from this formatter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonrefused failure is not proof of an accepted listener or absence; process-probe success does not establish port ownership and failure can include access denial.
 * @evidence contracts/common.md#meaningful-documentation The comment explains refusal versus silence, competing startup risk and plain-Node compatibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Formatting a fixed transport-fact record chooses no collection or observation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each diagnosis describes supplied current facts and does not cache a previous process-liveness answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned fact record and strings survive; this formatter owns no socket, timer or process handle.
 */
export function describeHumanViewerSilence(
  facts: IHumanViewerSilenceFacts,
): IHumanViewerSilence {
  const owner: string =
    facts.recordedPid === null
      ? "no process record for this port"
      : `recorded pid ${facts.recordedPid} ${facts.recordedAlive ? "answered the process probe" : "did not answer the process probe"}`;
  return {
    ready: false,
    answer: facts.refused ? "absent" : "unanswered",
    port: facts.port,
    probeMs: facts.probeMs,
    recordedPid: facts.recordedPid,
    recordedAlive: facts.recordedAlive,
    meaning: facts.refused
      ? `Port ${facts.port} refused this connection; ensure may try starting a viewer (${owner})`
      : `No complete /health answer was obtained from port ${facts.port} during the ${facts.probeMs} ms probe; this does not establish absence, so do not start another viewer on this port (${owner})`,
  };
}
