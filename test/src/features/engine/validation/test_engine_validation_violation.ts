import {
  violation
} from "../../../../../packages/engine/src/validation/internal/violation";
import { TestValidator } from "@nestia/e2e";

/**
 * `violation` builds one constraint row from its arguments, severity defaulting to
 * error and overshoot present only when supplied.
 *
 * Scenarios:
 *
 * 1. No overshoot and no severity: an error row without an overshoot key.
 * 2. An overshoot and a warning severity: both are carried unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the finding builder's default severity and absent or explicit overshoot.
 * @evidence contracts/development/testing.md#behavioral-verification Calls violation with explicit kind, path, expectation and values, in an omitted-arguments case and a supplied-warning case.
 * @evidence contracts/development/testing.md#independent-expectations The complete expected object fixes every authored field. An omitted severity defaults to error and leaves out the overshoot key. An explicit warning and half-unit overshoot are retained.
 */
export function test_engine_validation_violation(): void {
  TestValidator.equals(
    "defaults",
    violation("range", "$.a", "a in [0, 1]", 2),
    {
      kind: "range",
      path: "$.a",
      expected: "a in [0, 1]",
      value: 2,
      severity: "error",
    },
  );
  TestValidator.equals(
    "given",
    violation("type", "$.b", "unique", "x", 0.5, "warning"),
    {
      kind: "type",
      path: "$.b",
      expected: "unique",
      value: "x",
      overshoot: 0.5,
      severity: "warning",
    },
  );
}
