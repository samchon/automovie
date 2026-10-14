import { TestValidator } from "@nestia/e2e";

import { assessScenarioExecution } from "../../scenarioExecution";

/**
 * Scenario acceptance requires both a successful assertion and a duration below
 * the repository's strict unit budget, without replacing the original error.
 *
 * Scenarios:
 * 1. Durations of 0 and 499 ms pass only without an assertion error.
 * 2. Durations of 500 and 501 ms fail even when the assertion succeeds.
 * 3. An assertion error and a budget failure remain independently observable.
 * 4. Different timestamp offsets denoting the same instant yield zero duration.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls scenario assessment and observes parsed milliseconds, printed labels, strict budget acceptance, independent timing/assertion failure and retained input identity; accepting 500 milliseconds or discarding an assertion cause fails.
 * @evidence contracts/testing.md#independent-expectations Literal UTC start time plus authored 0/499/500/501-millisecond offsets independently fixes each duration, and the strict under-500-ms contract fixes acceptance; the equivalent-offset pair names one instant without using the assessment to calculate its oracle.
 * @evidence contracts/testing.md#distinguishing-cases Crosses four exact budget boundaries with success/assertion-failure twins, input nonmutation and equivalent timezone offsets; malformed/reversed clocks belong to the timing unit and scheduler accuracy is not measured here.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_workspace_scenario_execution_budget entry owns direct runner-policy assessment of resident records; it starts no scenario executor, process or wall-clock wait and does not claim measured runtime performance.
 */
export function test_workspace_scenario_execution_budget(): void {
  const failure: Error = new Error("the assertion failed");
  for (const elapsedMs of [0, 499, 500, 501])
    for (const error of [null, failure]) {
      const execution: Parameters<typeof assessScenarioExecution>[0] = {
        name: `test_budget_${elapsedMs}`,
        error,
        started_at: "2026-09-07T00:00:00.000Z",
        completed_at: new Date(Date.UTC(2026, 8, 7) + elapsedMs).toISOString(),
      };
      const snapshot: Parameters<typeof assessScenarioExecution>[0] = {
        ...execution,
      };
      const result: ReturnType<typeof assessScenarioExecution> =
        assessScenarioExecution(execution);
      const title: string = `${elapsedMs} ms with ${error === null ? "success" : "an assertion failure"}`;
      TestValidator.equals(`${title}: elapsed`, result.elapsedMs, elapsedMs);
      TestValidator.equals(
        `${title}: printed duration`,
        result.timingLabel,
        `${elapsedMs} ms`,
      );
      TestValidator.equals(
        `${title}: acceptance`,
        result.passed,
        error === null && elapsedMs < 500,
      );
      TestValidator.equals(
        `${title}: timing failure`,
        result.timingFailure,
        elapsedMs < 500
          ? null
          : `Scenario took ${elapsedMs} ms; every scenario must finish in under 500 ms.`,
      );
      TestValidator.predicate(
        `${title}: original result and assertion error are retained`,
        result.execution === execution && result.execution.error === error,
      );
      TestValidator.equals(`${title}: input is unchanged`, execution, snapshot);
    }
  const offset: ReturnType<typeof assessScenarioExecution> =
    assessScenarioExecution({
      name: "test_equal_instants",
      error: null,
      started_at: "2026-09-07T00:00:00.000Z",
      completed_at: "2026-09-07T09:00:00.000+09:00",
    });
  TestValidator.equals(
    "equivalent instants do not invent elapsed time",
    [offset.elapsedMs, offset.timingLabel, offset.timingFailure, offset.passed],
    [0, "0 ms", null, true],
  );
}
