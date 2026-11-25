import { solvePhysicalTargetStep } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a projected target step may stand from its closed form, in the step's
 * own units: the damped least-squares step is biased by its damping, which this
 * bound admits at ten parts per million.
 */
const STEP: number = 1e-5;

/**
 * A constrained coordinate cannot absorb the correction needed from a free one.
 *
 * Scenarios:
 *
 * 1. Identical columns share a free update equally.
 * 2. A lower-bound column requesting outward travel is removed and re-solved.
 * 3. The corresponding upper-bound and all-fixed systems remain bounded.
 */
export function test_unit_engine_physics_solve_physical_target_step(): void {
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
    Math.abs(free[0]! + 0.5) < STEP && Math.abs(free[1]! + 0.5) < STEP,
  );
  TestValidator.predicate(
    "lower bound redirects the full correction to the free variable",
    lower[0] === 0 && Math.abs(lower[1]! + 1) < STEP,
  );
  TestValidator.predicate(
    "upper bound redirects the opposite correction",
    upper[0] === 0 && Math.abs(upper[1]! - 1) < STEP,
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
