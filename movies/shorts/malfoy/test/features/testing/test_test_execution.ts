import { TestValidator } from "@nestia/e2e";

import { assessTestExecution } from "../../helpers/assessTestExecution";

/**
 * Pin assertion and timing acceptance used by the actual runner's final status.
 *
 * Scenarios:
 * 1. Zero and long elapsed durations pass when the assertion succeeds.
 * 2. Assertion failures, invalid timestamps and reversed timestamps fail.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the two scenarios, accepted elapsed durations and failed records, and the runner status each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the runner's assessment function with literal execution records and asserts the pass state and elapsed milliseconds; a discarded assertion error, accepted invalid timing or an invented duration limit fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected elapsed times are the differences between literal UTC instants, zero and 60000 milliseconds; an Error is a failure by the runner's definition.
 * @evidence contracts/development/testing.md#distinguishing-cases Cases cover zero and long elapsed time, an assertion failure, malformed start and end instants and reversed timing. Process exit and DynamicExecutor import belong to the runner source.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal records, discovered by test/index.ts as an exported test_ function; it spawns no process.
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
