import type { IScenarioExecutionAssessment } from "./IScenarioExecutionAssessment";

/**
 * Assess the existing executor record against the unchanged strict 500-ms budget without mutating it. Date parsing uses JavaScript's timestamp semantics rather than a monotonic clock or a new timestamp grammar.
 *
 * @evidence contracts/testing.md#behavioral-verification The runner and existing timing/budget tests observe duration, timing failure, label, acceptance and original-record identity, catching hidden assertion errors or acceptance of invalid, reversed or over-budget timing.
 * @evidence contracts/testing.md#independent-expectations Existing tests derive expected durations from literal UTC instants and the strict under-500-ms contract; this assessment supplies no independent measurement of executor wall-clock accuracy.
 * @evidence contracts/testing.md#distinguishing-cases The owning tests exercise zero, 499, 500 and 501 ms, equivalent offset instants, malformed/empty/out-of-range/reversed timestamps and simultaneous assertion failures; real scheduling accuracy is outside those portable fixtures.
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
    timingFailure =
      elapsedMs >= 500
        ? `Scenario took ${elapsedMs} ms; every scenario must finish in under 500 ms.`
        : null;
  }
  return {
    execution,
    elapsedMs,
    timingLabel: elapsedMs === null ? "invalid timing" : `${elapsedMs} ms`,
    timingFailure,
    passed: execution.error === null && timingFailure === null,
  };
}
