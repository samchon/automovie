/**
 * What a client learned when the viewer port gave no health answer.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the refused connection apart from an accepted connection that did not answer in time.
 * @evidence contracts/common.md#meaningful-documentation Names each observed fact the status report is derived from.
 * @author Samchon
 */
export interface IHumanViewerSilenceFacts {
  /** The connection was refused: nothing listens on the port. */
  refused: boolean;

  /** Port that was probed. */
  port: number;

  /** How long the probe waited for `/health`, in milliseconds. */
  probeMs: number;

  /** Pid in this port's process record, or null without a record. */
  recordedPid: number | null;

  /** Whether the recorded process still exists. */
  recordedAlive: boolean;
}
