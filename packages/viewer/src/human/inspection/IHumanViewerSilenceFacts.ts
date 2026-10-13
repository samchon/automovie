/**
 * What a client learned when the viewer port gave no health answer.
 *
 * @evidence contracts/common.md#principled-implementation A refused connection is independent from process-record existence and the duration of the unanswered probe.
 * @evidence contracts/common.md#clear-and-simple-design Observed connection and recorded-process facts are carried before the status owner derives an action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recorded liveness does not turn a refused or unanswered port into an inferred ready viewer.
 * @evidence contracts/common.md#meaningful-documentation Documents the refused connection, port, millisecond probe duration, nullable PID and observed liveness.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation A refused connection is independent from process-record existence and the duration of the unanswered probe.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Observed connection and recorded-process facts are carried before the status owner derives an action.
 * @author Samchon
 */
export interface IHumanViewerSilenceFacts {
  /**
   * The connection was refused: nothing listens on the port.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The connection was refused: nothing listens on the port. A refused connection is independent from process-record existence and the duration of the unanswered probe.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The connection was refused: nothing listens on the port. Observed connection and recorded-process facts are carried before the status owner derives an action.
   */
  refused: boolean;

  /**
   * Port that was probed.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Port that was probed. A refused connection is independent from process-record existence and the duration of the unanswered probe.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Port that was probed. Observed connection and recorded-process facts are carried before the status owner derives an action.
   */
  port: number;

  /**
   * How long the probe waited for `/health`, in milliseconds.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation How long the probe waited for `/health`, in milliseconds. A refused connection is independent from process-record existence and the duration of the unanswered probe.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform How long the probe waited for `/health`, in milliseconds. Observed connection and recorded-process facts are carried before the status owner derives an action.
   */
  probeMs: number;

  /**
   * Pid in this port's process record, or null without a record.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Pid in this port's process record, or null without a record. A refused connection is independent from process-record existence and the duration of the unanswered probe.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Pid in this port's process record, or null without a record. Observed connection and recorded-process facts are carried before the status owner derives an action.
   */
  recordedPid: number | null;

  /**
   * Whether the recorded process still exists.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Whether the recorded process still exists. A refused connection is independent from process-record existence and the duration of the unanswered probe.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Whether the recorded process still exists. Observed connection and recorded-process facts are carried before the status owner derives an action.
   */
  recordedAlive: boolean;
}
