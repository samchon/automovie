import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import { minimizeAutoMovieSimplexQuadratic } from "../../../../packages/engine/src/math/minimizeAutoMovieSimplexQuadratic";
import { solveAutoMovieQuadraticProgram } from "../../../../packages/engine/src/math/solveAutoMovieQuadraticProgram";
import { solveRecoveryFeasibleDirection } from "../../../../packages/recovery/src/internal/solveRecoveryFeasibleDirection";
import { measureRecoveryFeasibleArithmetic } from "../../../../packages/recovery/src/internal/measureRecoveryFeasibleArithmetic";
import { nclose } from "../internal/nclose";
import type { IRecoveryFeasibleDirectionCase } from "../internal/IRecoveryFeasibleDirectionCase";

/**
 * Bounded sparse simplex minimization preserves the pure direction QP.
 *
 * Scenarios:
 * 1. Curved, normal, abnormal and nonzero-offset direction models agree with closed-form primal/dual answers and the existing independent PSD primitive.
 * 2. Duplicate/reordered atoms and identical vectors with unequal offsets retain the authored convex objective, without an active-rank assumption or curvature floor.
 * 3. An all-empty constant simplex remains valid; zero-gradient rows are not rejected for lacking stored coefficients.
 * 4. Explicit transfer/work exhaustion remains nonconverged; malformed sparse coordinates and preallocation overflow are rejected.
 * 5. Fractional and cancelling rows distinguish actual returned-row residuals from a normalized-dual forward-error certificate; requested sub-ulp gaps and exhaustion are not relabelled as solved.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual generic minimizer and recovery direction certificate, reconstructs every primal halfspace and full primal-dual gap, and observes explicit bounded termination and unchanged inputs.
 * @evidence contracts/testing.md#independent-expectations Closed-form optima give curved d=(.5,.5), normal/abnormal d=0 with distinct objective multipliers, and nonzero-bound d=-.5,gamma=-.5,objective=-.375. Existing embedded PSD solving is a separate numerical algorithm, not a replacement for those analytic expectations.
 * @evidence contracts/testing.md#distinguishing-cases Covers nonzero affine terms, simplex degeneracy, exact duplicate normals, all-empty input, finite capacity, invalid sparse ordering, all-row certificate and no budget-limited success. Nonlinear retraction and camera ranks have separate tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_geometry_simplex_quadratic entry calls resident source arithmetic and the existing embedded numerical primitive only, without installation, native build, external process, browser or GPU.
 */
export function test_geometry_simplex_quadratic(): void {
  const problems: IRecoveryFeasibleDirectionCase[] = [
    {
      width: 2,
      rows: [
        { indices: [0], values: [-1], offset: 0 },
        { indices: [1], values: [-1], offset: 0 },
      ],
      expected: [0.5, 0.5],
      gamma: -0.5,
    },
    {
      width: 1,
      rows: [
        { indices: [0], values: [1], offset: 0 },
        { indices: [0], values: [-1], offset: 0 },
      ],
      expected: [0],
      gamma: 0,
    },
    {
      width: 1,
      rows: [
        { indices: [0], values: [-1], offset: 0 },
        { indices: [], values: [], offset: 0 },
      ],
      expected: [0],
      gamma: 0,
    },
    {
      width: 1,
      rows: [
        { indices: [0], values: [1], offset: 0 },
        { indices: [0], values: [-1], offset: 1 },
      ],
      expected: [-0.5],
      gamma: -0.5,
    },
  ];
  const before: string = JSON.stringify(problems);
  const native: ReturnType<typeof solveAutoMovieQuadraticProgram>[] =
    problems.map(
      (
        problem: (typeof problems)[number],
      ): ReturnType<typeof solveAutoMovieQuadraticProgram> =>
        solveAutoMovieQuadraticProgram({
          diagonal: [...new Array<number>(problem.width).fill(1), 0],
          linear: [...new Array<number>(problem.width).fill(0), 1],
          rows: problem.rows.map(
            (
              row: IAutoMovieSimplexAtom,
            ): Parameters<
              typeof solveAutoMovieQuadraticProgram
            >[0]["rows"][number] => ({
              indices: [...row.indices, problem.width],
              weights: [...row.values, -1],
              lower: null,
              upper: row.offset,
            }),
          ),
        }),
    );
  const results: ReturnType<typeof solveRecoveryFeasibleDirection>[] =
    problems.map(
      (
        problem: (typeof problems)[number],
      ): ReturnType<typeof solveRecoveryFeasibleDirection> =>
        solveRecoveryFeasibleDirection(problem.width, problem.rows, 1e-12, {
          maxIterations: 100,
          maxEntries: 1000,
          maxWork: 100000,
        }),
    );
  results.forEach((result: (typeof results)[number], at: number): void => {
    TestValidator.predicate(
      `complete pure-QP optimum ${at}`,
      result.certified &&
        native[at]!.status === 1 &&
        native[at]!.maximumViolation <= 1e-7 &&
        native[at]!.stationarityResidual <= 1e-7 &&
        result.maximumViolation <= 1e-12 &&
        result.complementarity <= 1e-12 &&
        result.step.every((value: number, axis: number): boolean =>
          nclose(value, problems[at]!.expected[axis]!, 1e-12),
        ) &&
        nclose(result.gamma, problems[at]!.gamma, 1e-12) &&
        result.step.every((value: number, axis: number): boolean =>
          nclose(value, native[at]!.primal[axis]!, 1e-4),
        ) &&
        nclose(result.gamma, native[at]!.primal[problems[at]!.width]!, 1e-7),
    );
  });
  TestValidator.predicate(
    "normal and abnormal objective multipliers differ",
    nclose(results[1]!.multipliers[0]!, 0.5, 1e-12) &&
      results[2]!.multipliers[0] === 0 &&
      nclose(results[3]!.multipliers[0]!, 0.75, 1e-12) &&
      nclose(results[3]!.objective, -0.375, 1e-12),
  );
  const constant: ReturnType<typeof minimizeAutoMovieSimplexQuadratic> =
    minimizeAutoMovieSimplexQuadratic(
      1,
      [
        { indices: [], values: [], offset: 3 },
        { indices: [], values: [], offset: -2 },
      ],
      1e-12,
      { maxIterations: 10, maxEntries: 100, maxWork: 10000 },
    );
  const duplicate: ReturnType<typeof minimizeAutoMovieSimplexQuadratic> =
    minimizeAutoMovieSimplexQuadratic(
      1,
      [
        { indices: [0], values: [1], offset: 1 },
        { indices: [0], values: [-1], offset: 0 },
        { indices: [0], values: [1], offset: 0 },
        { indices: [0], values: [1], offset: 0 },
      ],
      1e-12,
      { maxIterations: 100, maxEntries: 100, maxWork: 100000 },
    );
  TestValidator.predicate(
    "zero curvature offsets and dependent atoms are represented",
    constant.converged &&
      constant.objective === -2 &&
      constant.aggregate[0] === 0 &&
      constant.weights[1] === 1 &&
      duplicate.converged &&
      Math.abs(duplicate.objective) <= 1e-12,
  );
  const limited: ReturnType<typeof minimizeAutoMovieSimplexQuadratic> =
    minimizeAutoMovieSimplexQuadratic(
      2,
      [
        { indices: [0], values: [1], offset: 0 },
        { indices: [1], values: [1], offset: 0 },
        { indices: [0, 1], values: [-1, -1], offset: 0 },
      ],
      1e-12,
      { maxIterations: 1, maxEntries: 100, maxWork: 10000 },
    );
  let rejected: number = 0;
  for (const invalid of [
    [{ indices: [0, 0], values: [1, 2], offset: 0 }],
    [{ indices: [1], values: [1], offset: 0 }],
  ]) {
    try {
      minimizeAutoMovieSimplexQuadratic(1, invalid, 1e-12, {
        maxIterations: 10,
        maxEntries: 100,
        maxWork: 10000,
      });
    } catch {
      rejected++;
    }
  }
  let charged: number = 0;
  const workLimited: ReturnType<typeof minimizeAutoMovieSimplexQuadratic> =
    minimizeAutoMovieSimplexQuadratic(2, [
      { indices: [0], values: [1], offset: 0 },
      { indices: [1], values: [1], offset: 0 },
      { indices: [0, 1], values: [-1, -1], offset: 0 },
    ], 1e-12, { maxIterations: 100, maxEntries: 100, maxWork: 250 },
      (amount: number): void => { charged += amount; });
  let earlyRefusals: number = 0;
  for (const admission of [
    { width: 100, maxEntries: 103, maxWork: 209, rows: [{ indices: [], values: [], offset: 0 }] },
    { width: 2, maxEntries: 1, maxWork: 10000, rows: [{ indices: [0], values: [1], offset: 0 }] },
    { width: Number.MAX_SAFE_INTEGER, maxEntries: Number.MAX_SAFE_INTEGER, maxWork: Number.MAX_SAFE_INTEGER,
      rows: [{ indices: [0], values: [1], offset: 0 }] },
  ]) {
    let spent: number = 0;
    try {
      minimizeAutoMovieSimplexQuadratic(admission.width, admission.rows, 1e-12,
        { maxIterations: 10, maxEntries: admission.maxEntries, maxWork: admission.maxWork },
        (amount: number): void => { spent += amount; });
    } catch {
      if (spent <= admission.maxWork) earlyRefusals++;
    }
  }
  TestValidator.predicate(
    "finite budgets and malformed input cannot become solved",
    !limited.converged &&
      limited.termination === "iteration-budget" &&
      rejected === 2 && earlyRefusals === 3 &&
      !workLimited.converged && workLimited.termination === "work-budget" &&
      charged === workLimited.work && charged <= 250 &&
      JSON.stringify(problems) === before,
  );
  const nearCases: IRecoveryFeasibleDirectionCase[] = [
    { width: 1, rows: [
      { indices: [0], values: [1.1], offset: 0 },
      { indices: [0], values: [-1.3], offset: 0.7 },
    ], expected: [-7 / 24], gamma: -77 / 240 },
    { width: 1, rows: [
      { indices: [0], values: [-Math.SQRT2], offset: 0 },
      { indices: [0], values: [1], offset: 1e-5 },
    ], expected: [1e-5 / (1 + Math.SQRT2)], gamma: -Math.SQRT2 * 1e-5 / (1 + Math.SQRT2) },
    { width: 1, rows: [
      { indices: [0], values: [5 / 3], offset: 0 },
      { indices: [0], values: [-7 / 5], offset: 0.2 },
    ], expected: [-3 / 46], gamma: -5 / 46 },
  ];
  const nearResults: ReturnType<typeof solveRecoveryFeasibleDirection>[] = nearCases.map(
    (problem: IRecoveryFeasibleDirectionCase): ReturnType<typeof solveRecoveryFeasibleDirection> =>
      solveRecoveryFeasibleDirection(problem.width, problem.rows, 1e-30,
        { maxIterations: 100, maxEntries: 1000, maxWork: 100000 }),
  );
  const completeNear: boolean[] = nearResults.map(
    (result: (typeof nearResults)[number], at: number): boolean => {
      const problem: IRecoveryFeasibleDirectionCase = nearCases[at]!;
      const stationarity: number = problem.rows.reduce(
        (sum: number, row: IAutoMovieSimplexAtom, index: number): number =>
          sum + result.multipliers[index]! * row.values[0]!, result.step[0]!);
      const maximumSlack: number = Math.max(...problem.rows.map(
        (row: IAutoMovieSimplexAtom): number => row.values[0]! * result.step[0]! - result.gamma - row.offset));
      return nclose(result.step[0]!, problem.expected[0]!, 1e-12) &&
        nclose(result.gamma, problem.gamma, 1e-12) && Math.abs(stationarity) <= 1e-12 && maximumSlack <= 1e-12 &&
        result.simplexResidual <= 64 * Number.EPSILON * problem.rows.length &&
        result.stationarityResidual <= 1e-12 &&
        (!result.roundoffLimited || (result.certified && result.termination === "stalled" &&
          result.gap > 1e-30 && result.arithmeticAllowance > 0));
    });
  const wrapperRows: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [1], offset: 0 }, { indices: [1], values: [1], offset: 0 },
    { indices: [0, 1], values: [-1, -1], offset: 0 },
  ];
  const wrapperIteration: ReturnType<typeof solveRecoveryFeasibleDirection> =
    solveRecoveryFeasibleDirection(2, wrapperRows, 1e-12,
      { maxIterations: 1, maxEntries: 1000, maxWork: 100000 });
  const wrapperWork: ReturnType<typeof solveRecoveryFeasibleDirection> =
    solveRecoveryFeasibleDirection(2, wrapperRows, 1e-12,
      { maxIterations: 100, maxEntries: 1000, maxWork: 5800 });
  TestValidator.predicate(`numerical precision and budget boundaries: ${JSON.stringify(nearResults)}`,
    completeNear.every((value: boolean): boolean => value) &&
    nearResults.some((result: (typeof nearResults)[number]): boolean => result.roundoffLimited) &&
    !wrapperIteration.certified && wrapperIteration.termination === "iteration-budget" &&
    !wrapperWork.certified && wrapperWork.termination === "work-budget");
  const x: number = 1.999990726973375;
  let cancelledGradient: number = x / Math.hypot(1, x);
  for (let copy: number = 0; copy < 3; copy++) {
    cancelledGradient += (x - 3) / Math.hypot(1, x - 3);
  }
  const cancelledRows: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [cancelledGradient], offset: 0 },
    { indices: [0], values: [x / 2], offset: 1 - x * x / 4 },
    ...[0, 1, 2].map((): IAutoMovieSimplexAtom => ({ indices: [0], values: [(x - 3) / 2], offset: 1 - (x - 3) ** 2 / 4 })),
  ];
  const cancelled: ReturnType<typeof solveRecoveryFeasibleDirection> = solveRecoveryFeasibleDirection(
    1, cancelledRows, 1e-16, { maxIterations: 100, maxEntries: 1000, maxWork: 100000 });
  const first: IAutoMovieSimplexAtom = cancelledRows[0]!, second: IAutoMovieSimplexAtom = cancelledRows[1]!;
  const exactStep: number = second.offset / (second.values[0]! - first.values[0]!);
  const actualComplementarity: number = Math.abs(cancelled.multipliers[0]! *
    (first.values[0]! * cancelled.step[0]! - cancelled.gamma));
  TestValidator.predicate("cancellation retains actual row failure and separate numerical qualification",
    cancelled.certified && cancelled.roundoffLimited && !cancelled.returnedRowsQualified &&
      cancelled.reconstructionRowsQualified && cancelled.termination === "stalled" &&
      actualComplementarity > 1e-16 && nclose(actualComplementarity, cancelled.complementarity, 1e-25) &&
      nclose(cancelled.step[0]!, exactStep, 1e-14) && cancelled.aggregateAllowance > 0 &&
      cancelled.minimumPriceAllowance > 0 && cancelled.gapAllowance >= cancelled.gap &&
      !cancelled.exactGapTargetMet && cancelled.gapUpperBound > 1e-16);
  const largeCancellation: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [1e17], offset: 0 },
    { indices: [0], values: [1], offset: 0 },
    { indices: [0], values: [-1e17], offset: 0 },
  ];
  const rounded: ReturnType<typeof minimizeAutoMovieSimplexQuadratic> = {
    weights: [0.25, 0.5, 0.25], aggregate: [0], objective: 0,
    minimumPrice: 0, gap: 0, gapMassAllowance: 0, simplexResidual: 0,
    converged: true, termination: "gap", iterations: 0, work: 0,
  };
  const forward: ReturnType<typeof measureRecoveryFeasibleArithmetic> =
    measureRecoveryFeasibleArithmetic(largeCancellation, rounded);
  // Exact dyadic weights have mass one and aggregate one half, despite the
  // sequential binary64 aggregate losing that half between opposite 2.5e16 terms.
  TestValidator.predicate("forward bounds expose computed zero without claiming exact dual zero",
    forward.aggregate >= 0.5 && forward.minimumPrice >= 5e16 && forward.gap >= 5e16 &&
      Number.isFinite(forward.aggregate + forward.minimumPrice + forward.gap));
  let emptyWork: number = 0, emptyRefusalWork: number = 0;
  const emptyRows: IAutoMovieSimplexAtom[] = [{ indices: [], values: [], offset: 0 }];
  const empty: ReturnType<typeof solveRecoveryFeasibleDirection> = solveRecoveryFeasibleDirection(
    1, emptyRows, 1e-12, { maxIterations: 1, maxEntries: 1000, maxWork: 5000 },
    (amount: number): void => { emptyWork += amount; });
  let emptyRefused: boolean = false;
  try {
    solveRecoveryFeasibleDirection(1, emptyRows, 1e-12,
      { maxIterations: 1, maxEntries: 1000, maxWork: 2200 },
      (amount: number): void => { emptyRefusalWork += amount; });
  } catch {
    emptyRefused = true;
  }
  TestValidator.predicate("empty rows reserve fixed forward-bound work before execution",
    empty.certified && empty.exactGapTargetMet && empty.returnedRowsQualified &&
      emptyWork === empty.work && emptyWork > 312 && emptyWork <= 5000 &&
      emptyRefused && emptyRefusalWork < 2200);
}
