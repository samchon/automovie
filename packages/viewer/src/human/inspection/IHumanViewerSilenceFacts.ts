/**
 * What a client learned when the viewer port gave no health answer.
 *
 * @evidence contracts/common.md#principled-implementation Connection refusal stays separate from the recorded pid probe; an incomplete nonrefused health request cannot establish absence or an accepted listener.
 * @evidence contracts/common.md#clear-and-simple-design The factual input omits explanatory prose, letting describeHumanViewerSilence own the next-action interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A living recorded process is reported as evidence only, without assuming it answered health or owns an accepted listener.
 * @evidence contracts/common.md#meaningful-documentation Member documentation gives refused meaning, probed port, wait milliseconds and nullable recorded-process information.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The probe-facts declaration performs neither socket observation nor process lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Facts describe one probe and establish no persistent equivalence for later health requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation contains no socket reference; probe completion owns transport cleanup before this value is returned.
 *
 * @author Samchon
 */
export interface IHumanViewerSilenceFacts {
  /** ECONNREFUSED was observed during this connection attempt. */
  refused: boolean;

  /** Port that was probed. */
  port: number;

  /** How long the probe waited for `/health`, in milliseconds. */
  probeMs: number;

  /** Pid in this port's process record, or null without a record. */
  recordedPid: number | null;

  /** Whether signal-zero probing succeeded; false includes access failure and is not independent exit proof. */
  recordedAlive: boolean;
}
