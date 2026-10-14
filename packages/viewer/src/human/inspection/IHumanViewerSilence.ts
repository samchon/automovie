/**
 * Status for a port without a complete health answer. `absent` records connection refusal during the probe and permits a startup attempt. `unanswered` includes other transport or answer failures and establishes neither an accepted listener nor absence; another viewer must not be started from this result alone.
 *
 * @evidence contracts/common.md#principled-implementation The refusal flag selects absent and every other incomplete probe selects unanswered; neither outcome establishes viewer readiness or lasting port state.
 * @evidence contracts/common.md#clear-and-simple-design The status record combines the observed port result and process-record facts with a caller-facing next-action meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unanswered ports are not treated as permission to launch a competing viewer, and recorded process liveness is not readiness proof.
 * @evidence contracts/common.md#meaningful-documentation Comments define absent versus unanswered, millisecond probe duration, nullable recorded pid and the always-false ready flag.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The silence report selects no connection-probe or process-identity algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A probe report is a point-in-time observation, not authority to reuse listener or process state after it changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only diagnostic scalars and text are retained; no socket or process-control handle is transferred with the report.
 *
 * @author Samchon
 */
export interface IHumanViewerSilence {
  /** Always false: no health answer establishes readiness. */
  ready: false;

  /**
   * `absent` on connection refusal, otherwise `unanswered` for an incomplete probe.
   */
  answer: "absent" | "unanswered";

  /** Port that was probed. */
  port: number;

  /** How long the probe waited for `/health`, in milliseconds. */
  probeMs: number;

  /** Pid in this port's process record, or null without a record. */
  recordedPid: number | null;

  /** Whether the recorded pid answered signal-zero probing; false also includes permission failure. */
  recordedAlive: boolean;

  /** One sentence saying what the caller may do next. */
  meaning: string;
}
