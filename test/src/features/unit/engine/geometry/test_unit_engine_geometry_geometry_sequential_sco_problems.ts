import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import {
  HumanSequentialConvexFunctions as F,
  HumanSequentialConvex as SCO,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Trajopt's own unit cases of its sequential convex loop, ported from
 * github.com/joschu/trajopt src/sco/test/small-problems-unit.cpp at commit
 * 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c (BSD-2-Clause, Copyright (c) 2013,
 * John Schulman), each problem convexified by the port of trajopt's
 * `CostFromFunc` and `ConstraintFromFunc` (`HumanSequentialConvexFunctions`).
 *
 * Scenarios, each with the test's own parameters and tolerance:
 *
 * 1. QuadraticSeparable: x0² + (x1 - 1)² + (x2 - 2)² from (3, 4, 5), the diagonal
 *    Hessian, box 100: converged at (0, 1, 2) within 1e-3.
 * 2. QuadraticNonseparable: (x0 - x1 + 3 x2)² + (x0 - 1)² + (x2 - 2)² from (3, 4,
 *    5), the full Hessian, box 100, least box 1e-5, least improvement 1e-6:
 *    converged at (1, 7, 2) within 0.01.
 * 3. TP1, TP3, TP6 and TP7 of the Hock-Schittkowski collection, each with max_iter
 *    1000, least box 1e-5, least improvement 1e-10 and merit coefficient 1:
 *    converged at (1, 1), (0, 0), (1, 1) and (0, √3) within 0.01.
 */
export function test_unit_engine_geometry_geometry_sequential_sco_problems(): void {
  // 1. TEST(SQP, QuadraticSeparable).
  check(
    "QuadraticSeparable",
    {
      f: (x: F.Vector): number =>
        x[0]! ** 2 + (x[1]! - 1) ** 2 + (x[2]! - 2) ** 2,
      full: false,
    },
    null,
    [3, 4, 5],
    [0, 1, 2],
    1e-3,
    { ...SCO.DEFAULTS, trustBoxSize: 100 },
  );

  // 2. TEST(SQP, QuadraticNonseparable).
  check(
    "QuadraticNonseparable",
    {
      f: (x: F.Vector): number =>
        (x[0]! - x[1]! + 3 * x[2]!) ** 2 + (x[0]! - 1) ** 2 + (x[2]! - 2) ** 2,
      full: true,
    },
    null,
    [3, 4, 5],
    [1, 7, 2],
    0.01,
    {
      ...SCO.DEFAULTS,
      trustBoxSize: 100,
      minTrustBoxSize: 1e-5,
      minApproxImprove: 1e-6,
    },
  );

  // 3. testProblem: TP1, TP3, TP6, TP7.
  const constrained: IAutoMovieMotionHumanSequentialConvex.IParameters = {
    ...SCO.DEFAULTS,
    maxIter: 1000,
    minTrustBoxSize: 1e-5,
    minApproxImprove: 1e-10,
    meritErrorCoeff: 1,
  };
  check(
    "TP1",
    {
      f: (x: F.Vector): number => (x[1]! - x[0]! ** 2) ** 2 + (1 - x[0]!) ** 2,
      full: true,
    },
    { g: (x: F.Vector): F.Vector => [-1.5 - x[1]!], equality: false },
    [-2, 1],
    [1, 1],
    0.01,
    constrained,
  );
  check(
    "TP3",
    {
      f: (x: F.Vector): number => x[1]! + 1e-5 * (x[1]! - x[0]!) ** 2,
      full: true,
    },
    { g: (x: F.Vector): F.Vector => [0 - x[1]!], equality: false },
    [10, 1],
    [0, 0],
    0.01,
    constrained,
  );
  check(
    "TP6",
    { f: (x: F.Vector): number => (1 - x[0]!) ** 2, full: true },
    {
      g: (x: F.Vector): F.Vector => [10 * (x[1]! - x[0]! ** 2)],
      equality: true,
    },
    [10, 1],
    [1, 1],
    0.01,
    constrained,
  );
  check(
    "TP7",
    {
      f: (x: F.Vector): number => Math.log(1 + x[0]! ** 2) - x[1]!,
      full: true,
    },
    {
      g: (x: F.Vector): F.Vector => [(1 + x[0]! ** 2) ** 2 + x[1]! ** 2 - 4],
      equality: true,
    },
    [2, 2],
    [0, Math.sqrt(3)],
    0.01,
    constrained,
  );
}

/** Solve one case and check it, as `testProblem` and the two quadratic tests do. */
function check(
  name: string,
  cost: F.ICost,
  constraint: F.IConstraint | null,
  start: F.Vector,
  solution: F.Vector,
  tolerance: number,
  parameters: IAutoMovieMotionHumanSequentialConvex.IParameters,
): void {
  const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
    F.Vector,
    IAutoMovieMotionHumanSequentialConvex.IEvaluation
  > = SCO.minimise(
    F.problem({
      costs: [cost],
      constraints: constraint === null ? [] : [constraint],
      low: start.map((): number => -Infinity),
      high: start.map((): number => Infinity),
    }),
    start,
    parameters,
  );
  TestValidator.predicate(
    `${name} converges to trajopt's solution within ${tolerance}`,
    solved.status === "converged" &&
      solution.every(
        (v: number, i: number): boolean =>
          Math.abs(solved.x[i]! - v) <= tolerance,
      ),
  );
}
