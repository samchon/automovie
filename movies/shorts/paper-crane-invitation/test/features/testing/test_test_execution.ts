import { TestValidator } from "@nestia/e2e";

import { assessTestExecution } from "../../helpers/assessTestExecution";

/**
 * Pin assertion and timing acceptance used by the actual runner's final status.
 *
 * Scenarios:
 * 1. Zero and long elapsed durations pass when the assertion succeeds.
 * 2. Assertion failures, invalid timestamps and reversed timestamps fail.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the runner's assessment function with literal execution records and asserts acceptance and elapsed milliseconds, catching discarded assertion errors, invalid timing acceptance or an invented duration threshold; no test process is spawned.
 * @evidence contracts/testing.md#independent-cases Literal UTC instants independently yield zero and 60000 milliseconds; an Error is always a failure, malformed start/end and reversed timing yield null. Process exit and DynamicExecutor import behavior are source-reviewed rather than simulated by replacing globals.
 */
export function test_test_execution(): void {
  const started_at: string = "2026-01-01T00:00:00.000Z";
  TestValidator.equals(
    "zero elapsed",
    assessTestExecution({ error: null, started_at, completed_at: started_at }),
    { passed: true, elapsedMs: 0 },
  );
  TestValidator.equals(
    "long elapsed",
    assessTestExecution({
      error: null,
      started_at,
      completed_at: "2026-01-01T00:01:00.000Z",
    }),
    { passed: true, elapsedMs: 60000 },
  );
  TestValidator.equals(
    "assertion failure",
    assessTestExecution({
      error: new Error("failed assertion"),
      started_at,
      completed_at: started_at,
    }),
    { passed: false, elapsedMs: 0 },
  );
  for (const [started, completed] of [
    ["invalid", started_at],
    [started_at, "invalid"],
    ["2026-01-01T00:01:00.000Z", started_at],
  ] as const)
    TestValidator.equals(
      "invalid timing",
      assessTestExecution({
        error: null,
        started_at: started,
        completed_at: completed,
      }),
      { passed: false, elapsedMs: null },
    );
}
