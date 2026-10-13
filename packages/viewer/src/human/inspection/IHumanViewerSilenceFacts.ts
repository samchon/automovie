/**
 * What a client learned when the viewer port gave no health answer.
 *
 * @evidence contracts/common.md#principled-implementation A refused connection is independent from process-record existence and the duration of the unanswered probe.
 * @evidence contracts/common.md#clear-and-simple-design Observed connection and recorded-process facts are carried before the status owner derives an action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recorded liveness does not turn a refused or unanswered port into an inferred ready viewer.
 * @evidence contracts/common.md#meaningful-documentation Documents the refused connection, port, millisecond probe duration, nullable PID and observed liveness.
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
