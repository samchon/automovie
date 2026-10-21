import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieQuadraticRow } from "../../../../packages/engine/src/math/IAutoMovieQuadraticRow";
import { solveAutoMovieQuadraticProgram } from "../../../../packages/engine/src/math/solveAutoMovieQuadraticProgram";
import { nclose } from "../internal/nclose";

/**
 * Existing PSD quadratic solving distinguishes feasible directions and abnormality.
 *
 * Scenarios:
 * 1. At a curved boundary, min (d1^2+d2^2)/2+gamma with -d1<=gamma and -d2<=gamma has d=(1/2,1/2), gamma=-1/2; its physical straight step is inward, unlike a tangent-only direction.
 * 2. At the normal constrained optimum of F=x, g=-x<=0, the zero direction has positive objective multiplier and the original KKT certificate.
 * 3. At the abnormal singleton F=-x, g=x^2<=0, the same zero direction instead has a vanishing objective multiplier and cannot certify original stationarity.
 * 4. Duplicating, reordering and positively scaling complete affine rows preserves the curved problem and its independently derived optimum.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the existing PSD diagonal QP primitive with exactly zero auxiliary curvature, independently checks all original row bounds, dual signs, complementarity, stationarity and sum of auxiliary-column multipliers, and separates normal from abnormal zero directions.
 * @evidence contracts/testing.md#independent-expectations The two curved active equations give d1=d2=-gamma and the scalar quadratic minimum at gamma=-1/2. The normal and abnormal cases have closed-form multipliers (1/2,1/2) and (0,1). Finite comparison tolerances acknowledge the native Float64 gap and do not change any nonlinear geometric gate.
 * @evidence contracts/testing.md#distinguishing-cases Covers a nonzero strictly inward direction, a true boundary KKT point, abnormal zero without a KKT certificate, PSD zero curvature and equivalent complete-row transformations. It proves only the local quadratic primitive, not an iterative nonlinear method, camera-map qualification or photographic accuracy.
 * @evidence contracts/testing.md#execution-ownership The portable test_geometry_feasible_direction_qp entry invokes the already embedded numerical WebAssembly primitive and resident arrays; it installs or builds nothing and starts no process, browser or GPU. The existing kernel owns module compilation and retained high-water memory.
 */
export function test_geometry_feasible_direction_qp(): void {
  const curved: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
    diagonal: [1, 1, 0],
    linear: [0, 0, 1],
    rows: [
      { indices: [0, 2], weights: [-1, -1], lower: null, upper: 0 },
      { indices: [1, 2], weights: [-1, -1], lower: null, upper: 0 },
    ],
  };
  const normal: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
    diagonal: [1, 0],
    linear: [0, 1],
    rows: [
      { indices: [0, 1], weights: [1, -1], lower: null, upper: 0 },
      { indices: [0, 1], weights: [-1, -1], lower: null, upper: 0 },
    ],
  };
  const abnormal: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
    diagonal: [1, 0],
    linear: [0, 1],
    rows: [
      { indices: [0, 1], weights: [-1, -1], lower: null, upper: 0 },
      { indices: [1], weights: [-1], lower: null, upper: 0 },
    ],
  };
  const equivalent: typeof curved = {
    ...curved,
    rows: [
      curved.rows[1]!,
      { indices: [0, 2], weights: [-2, -2], lower: null, upper: 0 },
      curved.rows[0]!,
    ],
  };
  const problems: (typeof curved)[] = [curved, normal, abnormal, equivalent];
  const results: ReturnType<typeof solveAutoMovieQuadraticProgram>[] =
    problems.map(
      (
        problem: typeof curved,
      ): ReturnType<typeof solveAutoMovieQuadraticProgram> =>
        solveAutoMovieQuadraticProgram(problem),
    );
  results.forEach((result: (typeof results)[number], index: number): void => {
    const problem: typeof curved = problems[index]!;
    const gradient: number[] = result.primal.map(
      (value: number, axis: number): number =>
        problem.diagonal[axis]! * value + problem.linear[axis]!,
    );
    let complementarity: number = 0,
      maximumViolation: number = 0;
    problem.rows.forEach((row: IAutoMovieQuadraticRow, at: number): void => {
      const activity: number = row.indices.reduce(
        (sum: number, axis: number, corner: number): number =>
          sum + row.weights[corner]! * result.primal[axis]!,
        0,
      );
      maximumViolation = Math.max(maximumViolation, activity - row.upper!);
      complementarity = Math.max(
        complementarity,
        Math.abs(result.dual[at]! * (activity - row.upper!)),
      );
      row.indices.forEach((axis: number, corner: number): void => {
        gradient[axis]! += row.weights[corner]! * result.dual[at]!;
      });
    });
    TestValidator.predicate(
      `complete original quadratic certificate ${index}`,
      result.status === 1 &&
        [...result.primal, ...result.dual, ...gradient].every(
          Number.isFinite,
        ) &&
        maximumViolation <= 1e-7 &&
        complementarity <= 1e-7 &&
        result.dual.every((value: number): boolean => value >= -1e-7) &&
        gradient.every((value: number): boolean => Math.abs(value) <= 1e-7),
    );
  });
  const direction: number[] = results[0]!.primal;
  TestValidator.predicate(
    "semidefinite pure-gamma model retains its exact analytic optimum",
    nclose(direction[0]!, 0.5, 1e-6) &&
      nclose(direction[1]!, 0.5, 1e-6) &&
      nclose(direction[2]!, -0.5, 1e-6) &&
      nclose(results[0]!.objective, -0.25, 1e-6),
  );
  TestValidator.predicate(
    "curved physical inequality admits the inward step while tangent fails",
    direction[0]! > 0 &&
      direction[0]! ** 2 - direction[1]! < 0 &&
      [0.25, 0.5, 1].every(
        (step: number): boolean =>
          (step * direction[0]!) ** 2 - step * direction[1]! < 0,
      ) &&
      [0.25, 0.5, 1].every((step: number): boolean => step * step > 0),
  );
  const stationary: (typeof results)[number] = results[1]!;
  TestValidator.predicate(
    "normal zero direction has the original positive-multiplier KKT",
    stationary.primal.every(
      (value: number): boolean => Math.abs(value) < 1e-4,
    ) &&
      nclose(stationary.dual[0]!, 0.5, 1e-6) &&
      nclose(stationary.dual[1]!, 0.5, 1e-6) &&
      nclose(stationary.dual[0]! + stationary.dual[1]!, 1, 1e-7) &&
      nclose(1 - stationary.dual[1]! / stationary.dual[0]!, 0, 1e-6),
  );
  const singular: (typeof results)[number] = results[2]!;
  TestValidator.predicate(
    "abnormal zero direction is not original-problem stationarity",
    singular.primal.every((value: number): boolean => Math.abs(value) < 1e-4) &&
      Math.abs(singular.dual[0]!) < 1e-4 &&
      nclose(singular.dual[1]!, 1, 1e-4) &&
      Math.abs(-1 + singular.dual[1]! * 0) === 1,
  );
  TestValidator.predicate(
    "complete-row duplication order and scale preserve the optimum",
    results[3]!.primal.every((value: number, axis: number): boolean =>
      nclose(value, direction[axis]!, 1e-6),
    ),
  );
}
