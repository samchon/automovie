/**
 * The status report for a viewer port that gave no health answer. `absent`
 * means nothing listens, so `ensure` may start a viewer; `unanswered` means a
 * listener accepted the connection but did not answer within the probe, so a
 * viewer is probably alive and busy and another must not be started on the
 * same port.
 *
 * @evidence contracts/common.md#principled-implementation Reports the refused and the unanswered port as different outcomes instead of one not-ready value.
 * @evidence contracts/common.md#meaningful-documentation States what each answer allows a caller to do.
 * @author Samchon
 */
export interface IHumanViewerSilence {
  /** Always false: no health answer establishes readiness. */
  ready: false;

  /** `absent` when the connection was refused, `unanswered` when it timed out. */
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
