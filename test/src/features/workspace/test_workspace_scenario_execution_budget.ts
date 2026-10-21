import { TestValidator } from "@nestia/e2e";

import { assessScenarioExecution } from "../../scenarioExecution";

/**
 * Scenario durations are reported without an acceptance limit, while assertion
 * errors remain failures with their original identity.
 *
 * Scenarios:
 * 1. Zero and the former 499/500/501-ms boundaries preserve assertion outcomes.
 * 2. One minute, one day and the full valid timestamp range have no duration cap.
 * 3. An assertion error remains observable at every valid duration.
 * 4. Different timestamp offsets denoting the same instant yield zero duration.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls scenario assessment and observes parsed milliseconds, printed labels, duration-independent acceptance and retained input/error identity; any elapsed-time cutoff or swallowed assertion cause fails.
 * @evidence contracts/testing.md#independent-expectations Literal UTC instants and authored 0/499/500/501-ms, minute/day and full Date-range differences fix durations independently; every valid pair must preserve the assertion outcome without using assessment output as its oracle.
 * @evidence contracts/testing.md#distinguishing-cases Crosses former boundaries and long valid durations with success/assertion-failure twins, input nonmutation, the full Date range and equivalent timezone offsets; malformed/reversed clocks belong to the timing unit and scheduler accuracy is not measured here.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_workspace_scenario_execution_budget entry owns direct runner-policy assessment of resident records; it starts no scenario executor, process or wall-clock wait and does not claim measured runtime performance.
 */
export function test_workspace_scenario_execution_budget(): void {
  const failure: Error = new Error("the assertion failed");
  for (const elapsedMs of [0, 499, 500, 501, 60_000, 86_400_000])
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
        error === null,
      );
      TestValidator.equals(
        `${title}: timing failure`,
        result.timingFailure,
        null,
      );
      TestValidator.predicate(
        `${title}: original result and assertion error are retained`,
        result.execution === execution && result.execution.error === error,
      );
      TestValidator.equals(`${title}: input is unchanged`, execution, snapshot);
    }
  for (const error of [null, failure]) {
    const execution: Parameters<typeof assessScenarioExecution>[0] = {
      name: "test_full_timestamp_range",
      error,
      started_at: "-271821-04-20T00:00:00.000Z",
      completed_at: "+275760-09-13T00:00:00.000Z",
    };
    const result: ReturnType<typeof assessScenarioExecution> =
      assessScenarioExecution(execution);
    TestValidator.equals(
      "full valid Date range is reported without a duration cap",
      [
        result.elapsedMs,
        result.timingLabel,
        result.timingFailure,
        result.passed,
      ],
      [17_280_000_000_000_000, "17280000000000000 ms", null, error === null],
    );
    TestValidator.predicate(
      "full timestamp range retains the original assertion cause",
      result.execution === execution && result.execution.error === error,
    );
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
