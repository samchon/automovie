import type { IScenarioExecutionAssessment } from "./IScenarioExecutionAssessment";

/**
 * Report elapsed scenario time without a duration limit, retaining the original assertion result. Date parsing uses JavaScript's timestamp semantics rather than a monotonic clock or a new timestamp grammar.
 *
 * @evidence contracts/testing.md#behavioral-verification The runner and timing-policy tests observe elapsed time, clock failure, label, assertion-based acceptance and original-record identity, catching duration-based rejection, hidden assertion errors or acceptance of invalid and reversed timing.
 * @evidence contracts/testing.md#independent-expectations Tests derive durations from literal UTC instants and require every valid nonnegative duration to preserve the assertion outcome; this assessment supplies no independent measurement of executor wall-clock accuracy.
 * @evidence contracts/testing.md#distinguishing-cases The owning tests exercise zero, former 499/500/501-ms boundaries, long durations, equivalent offset instants, malformed/empty/out-of-range/reversed timestamps and simultaneous assertion failures; real scheduling accuracy and host hang timeouts are outside those portable fixtures.
 * @evidence contracts/testing.md#execution-ownership This portable runner helper is consumed by main and the existing workspace timing/budget entries; it parses two timestamps per call, allocates one assessment and retains the input reference without starting a host or caching records.
 */
export function assessScenarioExecution(
  execution: IScenarioExecutionAssessment["execution"],
): IScenarioExecutionAssessment {
  const started: number = new Date(execution.started_at).getTime();
  const completed: number = new Date(execution.completed_at).getTime();
  let elapsedMs: number | null = null;
  let timingFailure: string | null;
  if (
    !Number.isFinite(started) ||
    !Number.isFinite(completed) ||
    completed < started
  )
    timingFailure = `Invalid scenario timing: ${JSON.stringify(execution.started_at)} -> ${JSON.stringify(execution.completed_at)}.`;
  else {
    elapsedMs = completed - started;
    timingFailure = null;
  }
  return {
    execution,
    elapsedMs,
    timingLabel: elapsedMs === null ? "invalid timing" : `${elapsedMs} ms`,
    timingFailure,
    passed: execution.error === null && timingFailure === null,
  };
}
