/**
 * The status report for a viewer port that gave no health answer. `absent` means nothing listens, so `ensure` may start a viewer; `unanswered` means a listener accepted the connection but did not answer within the probe, so a viewer is probably alive and busy and another must not be started on the same port.
 *
 * @evidence contracts/common.md#principled-implementation Refused connections and accepted-but-unanswered probes are distinct so a timed-out observation cannot authorize a duplicate viewer.
 * @evidence contracts/common.md#clear-and-simple-design The status record separates probe duration, recorded PID existence and the caller-facing interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ready remains false without a health answer; elapsed probe time alone establishes neither absence nor restart authority.
 * @evidence contracts/common.md#meaningful-documentation Explains absent versus unanswered outcomes, millisecond probe duration and process-record limitations.
 * @author Samchon
 */
export interface IHumanViewerSilence {
  /** Always false: no health answer establishes readiness. */
  ready: false;

  /**
   * `absent` when the connection was refused, `unanswered` when it timed out.
   */
  answer: "absent" | "unanswered";

  /** Port that was probed. */
  port: number;

  /** How long the probe waited for `/health`, in milliseconds. */
  probeMs: number;

  /** Pid in this port's process record, or null without a record. */
  recordedPid: number | null;

  /** Whether the recorded process still exists. */
  recordedAlive: boolean;

  /** One sentence saying what the caller may do next. */
  meaning: string;
}
