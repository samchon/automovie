import { violation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * iolation builds one constraint row from its arguments, severity defaulting to
 * error and overshoot present only when supplied.
 *
 * Scenarios:
 *
 * 1. No overshoot and no severity: an error row without an overshoot key.
 * 2. An overshoot and a warning severity: both are carried unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls violation with and without the optional arguments and asserts the whole row each time.
 * @evidence contracts/development/testing.md#independent-expectations The row fields are the call arguments by definition of the constructor, so the expected rows are written by hand from the arguments.
 * @evidence contracts/development/testing.md#distinguishing-cases Absent versus present overshoot, and default versus given severity, are the two adjacent cases; invalid kinds are excluded by the type.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_validation_violation entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_validation_violation(): void {
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
