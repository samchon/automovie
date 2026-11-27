import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieQuadraticRow } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type Problem = Parameters<typeof AutoMovieEngineMath.solveQuadraticProgram>[0];
type Result = ReturnType<typeof AutoMovieEngineMath.solveQuadraticProgram>;

/**
 * `solveQuadraticProgram` on semidefinite feasible-direction problems
 * returns a complete KKT certificate and tells a normal multiplier from an
 * abnormal one.
 *
 * Certificate: status 1, rows violated by at most 1e-7, |dual x slack| <= 1e-7,
 * duals >= -1e-7 and the Lagrangian gradient within 1e-7 of zero.
 *
 * Scenarios:
 *
 * 1. Curved boundary: min (d1^2 + d2^2) / 2 + gamma with -d1 <= gamma and -d2 <=
 *    gamma has d = (1/2, 1/2), gamma = -1/2, objective -1/4; steps 0.25, 0.5
 *    and 1 along d stay inside x^2 - y < 0.
 * 2. Normal optimum of F = x, g = -x <= 0: zero direction, duals (1/2, 1/2).
 * 3. Abnormal singleton F = -x, g = x^2 <= 0: zero direction with the objective
 *    multiplier 0 and the constraint's 1.
 * 4. The curved rows reordered, one duplicated and scaled by 2: the same optimum
 *    within 1e-6.
 */
export function test_engine_geometry_quadratic_feasible_direction(): void {
  const row = (
    indices: number[],
    weights: number[],
  ): IAutoMovieQuadraticRow => ({ indices, weights, lower: null, upper: 0 });
  const curved: Problem = {
    diagonal: [1, 1, 0],
    linear: [0, 0, 1],
    rows: [row([0, 2], [-1, -1]), row([1, 2], [-1, -1])],
  };
  const normal: Problem = {
    diagonal: [1, 0],
    linear: [0, 1],
    rows: [row([0, 1], [1, -1]), row([0, 1], [-1, -1])],
  };
  const abnormal: Problem = {
    diagonal: [1, 0],
    linear: [0, 1],
    rows: [row([0, 1], [-1, -1]), row([1], [-1])],
  };
  const equivalent: Problem = {
    ...curved,
    rows: [curved.rows[1]!, row([0, 2], [-2, -2]), curved.rows[0]!],
  };
  const near = (x: number, y: number, e: number): boolean =>
    Math.abs(x - y) <= e;
  const solve = (label: string, problem: Problem): Result => {
    const result: Result = AutoMovieEngineMath.solveQuadraticProgram(problem);
    const gradient: number[] = result.primal.map(
      (x: number, i: number): number =>
        problem.diagonal[i]! * x + problem.linear[i]!,
    );
    let violation: number = 0;
    let complementarity: number = 0;
    problem.rows.forEach((r: IAutoMovieQuadraticRow, at: number): void => {
      const activity: number = r.indices.reduce(
        (sum: number, i: number, k: number): number =>
          sum + r.weights[k]! * result.primal[i]!,
        0,
      );
      violation = Math.max(violation, activity - r.upper!);
      complementarity = Math.max(
        complementarity,
        Math.abs(result.dual[at]! * (activity - r.upper!)),
      );
      r.indices.forEach(
        (i: number, k: number): void =>
          void (gradient[i]! += r.weights[k]! * result.dual[at]!),
      );
    });
    TestValidator.predicate(
      `${label} certificate`,
      result.status === 1 &&
        violation <= 1e-7 &&
        complementarity <= 1e-7 &&
        result.dual.every((y: number): boolean => y >= -1e-7) &&
        gradient.every((g: number): boolean => Math.abs(g) <= 1e-7),
    );
    return result;
  };

  // 1.
  const d: Result = solve("curved", curved);
  TestValidator.predicate(
    "curved optimum",
    near(d.primal[0]!, 0.5, 1e-6) &&
      near(d.primal[1]!, 0.5, 1e-6) &&
      near(d.primal[2]!, -0.5, 1e-6) &&
      near(d.objective, -0.25, 1e-6),
  );
  TestValidator.predicate(
    "inward steps",
    [0.25, 0.5, 1].every(
      (s: number): boolean => (s * d.primal[0]!) ** 2 - s * d.primal[1]! < 0,
    ),
  );

  // 2.
  const n: Result = solve("normal", normal);
  TestValidator.predicate(
    "normal multipliers",
    n.primal.every((x: number): boolean => Math.abs(x) < 1e-4) &&
      near(n.dual[0]!, 0.5, 1e-6) &&
      near(n.dual[1]!, 0.5, 1e-6),
  );

  // 3.
  const a: Result = solve("abnormal", abnormal);
  TestValidator.predicate(
    "abnormal multipliers",
    a.primal.every((x: number): boolean => Math.abs(x) < 1e-4) &&
      Math.abs(a.dual[0]!) < 1e-4 &&
      near(a.dual[1]!, 1, 1e-4),
  );

  // 4.
  const e: Result = solve("equivalent", equivalent);
  TestValidator.predicate(
    "equivalent optimum",
    e.primal.every((x: number, i: number): boolean =>
      near(x, d.primal[i]!, 1e-6),
    ),
  );
}
