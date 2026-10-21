import { TestValidator } from "@nestia/e2e";

import { assessScenarioExecution } from "../../scenarioExecution";

/**
 * A malformed or reversed executor clock record cannot masquerade as a valid
 * passing scenario, including when an assertion already failed.
 *
 * Scenarios:
 * 1. An unparseable start, completion, or both refuse a duration.
 * 2. Empty and out-of-range timestamps fail rather than becoming zero time.
 * 3. A completion one millisecond before its start fails without clamping.
 * 4. Every invalid timing shape retains any simultaneous assertion error.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls scenario assessment for invalid or reversed clock records, observing refused acceptance, null duration, explicit invalid-timing text and unchanged error identity; fabricated zero time, clamped reversal or swallowed assertion failure fails.
 * @evidence contracts/testing.md#independent-expectations Unparseable/empty/out-of-range timestamp literals and a completion exactly one millisecond before its start independently establish invalidity, while an authored Error provides the identity oracle; no real executor clock or captured assessment output is used.
 * @evidence contracts/testing.md#distinguishing-cases Crosses invalid start/end/both, empty endpoints, out-of-range endpoints and reversal with success/error twins; valid duration, offset equivalence and duration-independent acceptance belong to the budget-policy unit.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_workspace_scenario_execution_timing entry owns direct portable runner-policy calls over resident timestamp records, with no executor discovery, host process or clock manipulation.
 */
export function test_workspace_scenario_execution_timing(): void {
  const failure: Error = new Error("the assertion also failed");
  const instant: string = "2026-09-07T00:00:00.000Z";
  for (const [started_at, completed_at] of [
    ["not-an-instant", instant],
    [instant, "not-an-instant"],
    ["not-an-instant", "also-not-an-instant"],
    ["", instant],
    [instant, ""],
    ["+999999-01-01T00:00:00.000Z", instant],
    [instant, "+999999-01-01T00:00:00.000Z"],
    [instant, "2026-09-06T23:59:59.999Z"],
  ])
    for (const error of [null, failure]) {
      const execution: Parameters<typeof assessScenarioExecution>[0] = {
        name: "test_invalid_timing",
        error,
        started_at,
        completed_at,
      };
      const result: ReturnType<typeof assessScenarioExecution> =
        assessScenarioExecution(execution);
      const title: string = `${JSON.stringify(started_at)} -> ${JSON.stringify(completed_at)}`;
      TestValidator.equals(
        `${title}: refuses acceptance`,
        result.passed,
        false,
      );
      TestValidator.equals(
        `${title}: no fabricated duration`,
        result.elapsedMs,
        null,
      );
      TestValidator.equals(
        `${title}: printed invalid timing`,
        result.timingLabel,
        "invalid timing",
      );
      TestValidator.equals(
        `${title}: retains the invalid timing facts`,
        result.timingFailure,
        `Invalid scenario timing: ${JSON.stringify(started_at)} -> ${JSON.stringify(completed_at)}.`,
      );
      TestValidator.predicate(
        `${title}: retains the original assertion error`,
        result.execution === execution && result.execution.error === error,
      );
    }
}
