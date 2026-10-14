/**
 * An independent nearly parallel constraint family guards the numerical method
 * used by shared surface contact. Small primal residual alone is insufficient:
 * the weakly observed coordinate must still reach the known constrained answer.
 * No portrait data, reference image or previous solver output supplies it.
 */
import { solveAutoMovieQuadraticProgram } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Pins the exact feasible set as a contact plane approaches an existing cap.
 * With 0 <= x,y <= 1 and x + epsilon*y >= 1 + epsilon, positive epsilon forces
 * x=y=1. At epsilon=0 the constraint loses y and its minimum becomes y=0.
 *
 * Scenarios:
 * 1. Epsilon from 1 to 1e-8 retains feasibility and the exact corner optimum,
 *    despite the contact normal becoming nearly parallel to x's upper cap.
 * 2. A zero coefficient truly removes that constraint on y; the algorithm must
 *    distinguish this boundary from a tiny nonzero coefficient.
 * 3. A positive gap beyond the same caps is infeasible, not a relaxed success.
 *
 * @evidence contracts/testing.md#behavioral-verification Solves the existing nearly parallel bounded two-variable family, requiring solved status, both coordinates near the forced corner, small original-row residual and objective/dual agreement. Zero coupling must release y to its objective centre, and a positive additional gap must retain primal-infeasible status.
 * @evidence contracts/testing.md#independent-expectations With upper bounds one, positive epsilon makes x+epsilon*y>=1+epsilon force x=y=1, whose half-weighted objective is 2.5. At epsilon zero, minimum y is zero; adding 0.1 at epsilon one is infeasible. The retained strict tolerances allow numerical approximation, and dual-gap agreement uses reported solver values rather than independently reconstructing every dual coefficient.
 * @evidence contracts/testing.md#distinguishing-cases Preserves five positive epsilon scales from one to 1e-8, the exact zero-coupling boundary and positive-gap contradiction. General dimension/coefficient admission and unrelated QP optima belong to quadratic-refusals/program.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry is CPU/WebAssembly integration through the actual admitted QP adapter and pinned Clarabel reactor. It installs no consumer, builds no native artifact and starts no external process, browser or GPU; it owns every listed numerical case without dynamic registration.
 */
export function test_geometry_quadratic_degeneracy(): void {
  const solve: (
    epsilon: number,
    gap?: number,
  ) => ReturnType<typeof solveAutoMovieQuadraticProgram> = (
    epsilon: number,
    gap: number = 0,
  ): ReturnType<typeof solveAutoMovieQuadraticProgram> =>
    solveAutoMovieQuadraticProgram({
      diagonal: [1, 4],
      linear: [0, 0],
      rows: [
        { indices: [0], weights: [1], lower: 0, upper: 1 },
        { indices: [1], weights: [1], lower: 0, upper: 1 },
        {
          indices: [0, 1],
          weights: [1, epsilon],
          lower: 1 + epsilon + gap,
          upper: null,
        },
      ],
    });
  for (const epsilon of [1, 1e-2, 1e-4, 1e-6, 1e-8]) {
    const result: ReturnType<typeof solveAutoMovieQuadraticProgram> =
      solve(epsilon);
    TestValidator.equals("feasible corner is solved", result.status, 1);
    TestValidator.predicate(
      "both coordinates reach the mathematically forced corner",
      result.primal.length === 2 &&
        result.primal.every(
          (value: number): boolean =>
            nclose(value, 1, 1e-7) && Math.abs(value - 1) < 1e-7,
        ),
    );
    TestValidator.predicate(
      "original rows remain satisfied",
      result.maximumViolation < 1e-8,
    );
    TestValidator.predicate(
      "independent objective and dual gap",
      nclose(result.objective, 2.5, 1e-7) &&
        Math.abs(result.objective - 2.5) < 1e-7 &&
        nclose(result.objective, result.dualObjective, 1e-7) &&
        Math.abs(result.objective - result.dualObjective) < 1e-7,
    );
  }
  const zero: ReturnType<typeof solveAutoMovieQuadraticProgram> = solve(0);
  TestValidator.equals("zero-coefficient boundary solves", zero.status, 1);
  TestValidator.predicate(
    "unconstrained y returns to its objective centre",
    nclose(zero.primal[0], 1, 1e-7) &&
      Math.abs(zero.primal[0] - 1) < 1e-7 &&
      nclose(zero.primal[1], 0, 1e-4) &&
      Math.abs(zero.primal[1]) < 1e-4,
  );
  TestValidator.equals("positive gap is infeasible", solve(1, 0.1).status, 2);
}
