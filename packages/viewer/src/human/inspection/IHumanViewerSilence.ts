/**
 * The status report for a viewer port that gave no health answer. `absent` means nothing listens, so `ensure` may start a viewer; `unanswered` means a listener accepted the connection but did not answer within the probe, so a viewer is probably alive and busy and another must not be started on the same port.
 *
 * @evidence contracts/common.md#principled-implementation Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
 * @evidence contracts/common.md#clear-and-simple-design The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ready remains false without a health answer; elapsed probe time alone establishes neither absence nor restart authority.
 * @evidence contracts/common.md#meaningful-documentation Explains absent versus unanswered outcomes, millisecond probe duration and process-record limitations.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
 * @author Samchon
 */
export interface IHumanViewerSilence {
  /**
   * Always false: no health answer establishes readiness.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Always false: no health answer establishes readiness. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Always false: no health answer establishes readiness. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  ready: false;

  /**
   * `absent` when the connection was refused, `unanswered` when it timed out.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation `absent` when the connection was refused, `unanswered` when it timed out. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform `absent` when the connection was refused, `unanswered` when it timed out. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  answer: "absent" | "unanswered";

  /**
   * Port that was probed.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Port that was probed. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Port that was probed. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  port: number;

  /**
   * How long the probe waited for `/health`, in milliseconds.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation How long the probe waited for `/health`, in milliseconds. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform How long the probe waited for `/health`, in milliseconds. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  probeMs: number;

  /**
   * Pid in this port's process record, or null without a record.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Pid in this port's process record, or null without a record. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Pid in this port's process record, or null without a record. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  recordedPid: number | null;

  /**
   * Whether the recorded process still exists.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Whether the recorded process still exists. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Whether the recorded process still exists. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  recordedAlive: boolean;

  /**
   * One sentence saying what the caller may do next.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation One sentence saying what the caller may do next. Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One sentence saying what the caller may do next. The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
   */
  meaning: string;
}
