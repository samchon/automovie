import { solvePhysicalTargetStep } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** A constrained coordinate cannot absorb the correction needed from a free one.
 *
 * Scenarios:
 * 1. Identical columns share a free update equally.
 * 2. A lower-bound column requesting outward travel is removed and re-solved.
 * 3. The corresponding upper-bound and all-fixed systems remain bounded.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `solvePhysicalTargetStep` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate, 2x TestValidator.equals; 3 numbered scenarios (first: Identical columns share a free update equally.; last: The corresponding upper-bound and all-fixed systems remain bounded.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (5 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Identical columns share a free update equally.; last: The corresponding upper-bound and all-fixed systems remain bounded.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_target_step`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Identical columns share a free update equally.).
 */
export function test_physical_target_step(): void {
  const solve: (error: number, minimum: number, maximum: number) => number[] = (
    error: number,
    minimum: number,
    maximum: number,
  ): number[] =>
    solvePhysicalTargetStep({
      columns: [[1], [1]],
      errors: [error],
      coordinates: [
        { value: 0, minimum, maximum },
        { value: 0, minimum: -2, maximum: 2 },
      ],
      damping: 0.001,
    });
  const free: number[] = solve(1, -2, 2);
  const lower: number[] = solve(1, 0, 2);
  const upper: number[] = solve(-1, -2, 0);
  TestValidator.predicate(
    "free equal columns share the correction",
    Math.abs(free[0]! + 0.5) < 1e-5 && Math.abs(free[1]! + 0.5) < 1e-5,
  );
  TestValidator.predicate(
    "lower bound redirects the full correction to the free variable",
    lower[0] === 0 && Math.abs(lower[1]! + 1) < 1e-5,
  );
  TestValidator.predicate(
    "upper bound redirects the opposite correction",
    upper[0] === 0 && Math.abs(upper[1]! - 1) < 1e-5,
  );
  TestValidator.equals(
    "a fixed-only system has no search direction",
    solvePhysicalTargetStep({
      columns: [[1]],
      errors: [1],
      coordinates: [{ value: 0, minimum: 0, maximum: 0 }],
      damping: 0.001,
    }),
    [0],
  );
  const sparse: number[] = solvePhysicalTargetStep({
    columns: [
      [1, 0, 0],
      [1, 0, 0],
      [0, 0, 0],
    ],
    errors: [1, 100, -100],
    coordinates: Array.from(
      { length: 3 },
      (): { value: number; minimum: number; maximum: number } => ({
        value: 0,
        minimum: -2,
        maximum: 2,
      }),
    ),
    damping: 0.001,
  });
  TestValidator.equals(
    "constant residuals and zero columns do not alter the free update",
    sparse,
    [...free, 0],
  );
}
