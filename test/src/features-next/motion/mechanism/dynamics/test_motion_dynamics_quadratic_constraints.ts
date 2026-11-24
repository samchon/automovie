import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";
import { HumanQuadraticProgram } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";

/**
 * Project the point (4, 3) onto the half-plane x + 2y <= 5.
 *
 * Scenarios:
 * 1. The correction follows the row normal (1, 2) until the active bound.
 * 2. Moving the row beyond the point leaves the point free.
 * 3. Two disjoint hard half-lines have no feasible point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the constrained minimizer coordinates from the public quadratic solver.
 * @evidence contracts/development/testing.md#independent-expectations The original point overshoots by five and the squared normal length is five. Subtracting one normal gives (3, 1).
 * @evidence contracts/development/testing.md#distinguishing-cases Active and slack inequalities produce different minimizers.
 * @evidence contracts/development/testing.md#execution-ownership Solves two in-memory problems with the same metric.
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry and both outcomes.
 */
export function test_motion_dynamics_quadratic_constraints(): void {
  const impossible: IAutoMovieMotionHumanQuadraticProgram.IState =
    HumanQuadraticProgram.solve({
      n: 1,
      band: 0,
      p: [Float64Array.of(1)],
      q: Float64Array.of(0),
      rows: [
        { index: [0], coef: [1], l: 1, u: Infinity },
        { index: [0], coef: [1], l: -Infinity, u: 0 },
      ],
    });
  TestValidator.equals(
    "disjoint feasible half-lines",
    impossible.status,
    "infeasible",
  );
  for (const [upper, x, y] of [
    [5, 3, 1],
    [11, 4, 3],
  ] as const) {
    const result: IAutoMovieMotionHumanQuadraticProgram.IState =
      HumanQuadraticProgram.solve({
        n: 2,
        band: 1,
        p: [Float64Array.of(1, 0), Float64Array.of(1, 0)],
        q: Float64Array.of(-4, -3),
        rows: [{ index: [0, 1], coef: [1, 2], l: -Infinity, u: upper }],
      });
    TestValidator.predicate(
      `nearest point for bound ${upper}`,
      nclose(result.x[0]!, x) && nclose(result.x[1]!, y),
    );
  }
}
