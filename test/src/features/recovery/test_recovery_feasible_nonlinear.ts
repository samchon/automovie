import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import { refineRecoveryFeasibleState } from "../../../../packages/recovery/src/internal/refineRecoveryFeasibleState";
import type { IAutoMovieRecoveryFeasibleFit } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleFit";
import type { IAutoMovieRecoveryFeasibleModel } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";
import { nclose } from "../internal/nclose";
import type { IRecoveryFeasibleSpecification } from "../internal/IRecoveryFeasibleSpecification";
import type { IRecoveryFeasibleObservation } from "../internal/IRecoveryFeasibleObservation";

/**
 * Feasible nonlinear descent separates boundary KKT, outward stalling and curvature.
 *
 * Scenarios:
 * 1. Vector soft-L1 with residuals x and three copies of x-3 starts at 1.5 and converges to the constrained endpoint x=2, whose raw objective gradient is not zero.
 * 2. Residuals x+2, three copies of x-1 and y-1 start at (0,0); the old outward x/y direction cannot take a feasible positive step, but the new method reaches the unique constrained minimum (0,1).
 * 3. A circular residual (x,y), three scalar x-3 residuals and y-1 start at (2,0); every positive tangent-only y step is infeasible, while a strict inward method reaches the independently determined curved-boundary optimum.
 * 4. The singleton constraint x^2<=0 at zero with objective -x has only abnormal zero duals and must remain nonconverged; exhausting one actual trial also cannot certify convergence.
 * 5. The same three normal problems exercise optional complete-affine-QP mixing/curvature and same-base full/half selection with the original100 actual trials, population, gates and independent expected optima; qualified unselected evaluations remain in that horizon.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the source-owned feasible nonlinear controller and bounded direction solver with actual complete-population norm-at-most-two checks on every accepted/rejected trial. Normal termination requires original-coordinate KKT, while abnormality and insufficient trial budget remain incomplete.
 * @evidence contracts/testing.md#independent-expectations Convex scalar derivatives give exact endpoints (2) and (0,1). On the circle, independent bisection of the authored objective restricted to x=2*cos(theta),y=2*sin(theta) gives the unique boundary optimum. No source output supplies expected states; source certificate checks supplement rather than replace these expectations.
 * @evidence contracts/testing.md#distinguishing-cases Runs baseline and optional SQP/curvature on the same three authored problems, separates QP/mixed/normal status, nonlinear curved feasibility, abnormal zero and actual outer exhaustion. This is analytic method evidence, not photographic registration or point accuracy.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_nonlinear entry uses resident scalar arrays and source numerical helpers only, with no host, native build, image, process, browser or GPU.
 */
export function test_recovery_feasible_nonlinear(): void {
  const specifications: IRecoveryFeasibleSpecification[] = [
    {
      start: [1.5],
      residuals: (s: readonly number[]): number[][] => [
        [s[0]!],
        ...[0, 1, 2].map((): number[] => [s[0]! - 3]),
      ],
      derivatives: (): number[][][] => [[[1]], [[1]], [[1]], [[1]]],
    },
    {
      start: [0, 0],
      residuals: (s: readonly number[]): number[][] => [
        [s[0]! + 2],
        ...[0, 1, 2].map((): number[] => [s[0]! - 1]),
        [s[1]! - 1],
      ],
      derivatives: (): number[][][] => [
        [[1, 0]],
        [[1, 0]],
        [[1, 0]],
        [[1, 0]],
        [[0, 1]],
      ],
    },
    {
      start: [2, 0],
      residuals: (s: readonly number[]): number[][] => [
        [s[0]!, s[1]!],
        ...[0, 1, 2].map((): number[] => [s[0]! - 3]),
        [s[1]! - 1],
      ],
      derivatives: (): number[][][] => [
        [
          [1, 0],
          [0, 1],
        ],
        [[1, 0]],
        [[1, 0]],
        [[1, 0]],
        [[0, 1]],
      ],
    },
  ];
  const observed: IRecoveryFeasibleObservation[] = [];
  const problems: IAutoMovieRecoveryFeasibleProblem<number[]>[] =
    specifications.map(
      (
        specification: (typeof specifications)[number],
      ): IAutoMovieRecoveryFeasibleProblem<number[]> => ({
        initial: specification.start.slice(),
        evaluate: (state: number[]): number | null => {
          const residuals: number[][] = specification.residuals(state);
          if (
            residuals.some((row: number[]): boolean => Math.hypot(...row) > 2)
          )
            return null;
          return residuals.reduce((sum: number, row: number[]): number => {
            const norm: number = Math.hypot(...row);
            return sum + norm * (norm / (Math.hypot(1, norm) + 1));
          }, 0);
        },
        linearize: (state: number[]): IAutoMovieRecoveryFeasibleModel => {
          const residuals: number[][] = specification.residuals(state);
          const derivatives: number[][][] = specification.derivatives(state);
          const gradient: number[] = new Array<number>(state.length).fill(0);
          const constraints: IAutoMovieSimplexAtom[] = residuals.map(
            (row: number[], at: number): IAutoMovieSimplexAtom => {
              const norm: number = Math.hypot(...row);
              const derivative: number[] = new Array<number>(state.length).fill(
                0,
              );
              for (let axis: number = 0; axis < state.length; axis++)
                for (
                  let component: number = 0;
                  component < row.length;
                  component++
                ) {
                  const product: number =
                    row[component]! * derivatives[at]![component]![axis]!;
                  gradient[axis]! += product / Math.hypot(1, norm);
                  derivative[axis]! += product / 2;
                }
              return {
                indices: state.map((_: number, axis: number): number => axis),
                values: derivative,
                offset: 1 - (norm * norm) / 4,
              };
            },
          );
          const rows: IAutoMovieSimplexAtom[] = [
            {
              indices: state.map((_: number, axis: number): number => axis),
              values: gradient,
              offset: 0,
            },
            ...constraints,
          ];
          return {
            rows,
            physicalRows: rows,
            width: state.length,
            fromMetric: (step: readonly number[]): number[] => step.slice(),
            toPhysicalCovector: (value: readonly number[]): number[] => value.slice(),
          };
        },
        retract: (state: number[], step: readonly number[]): number[] =>
          state.map(
            (value: number, axis: number): number => value + step[axis]!,
          ),
        constraintValues: (state: number[], selected: readonly number[]): number[] => {
          const residuals: number[][] = specification.residuals(state);
          return selected.map((row: number): number => Math.hypot(...residuals[row - 1]!) ** 2 / 4 - 1);
        },
      }),
    );
  const results: IAutoMovieRecoveryFeasibleFit<number[]>[] = problems.map(
    (
      problem: IAutoMovieRecoveryFeasibleProblem<number[]>,
    ): IAutoMovieRecoveryFeasibleFit<number[]> => {
      const row: (typeof observed)[number] = {
        work: 0,
        checkpoints: 0,
      };
      observed.push(row);
      return refineRecoveryFeasibleState(
        problem,
        100,
        1e-8,
        { maxIterations: 10000, maxEntries: 10000, maxWork: 10000000 },
        (): void => {
          row.checkpoints++;
        },
        (work: number): void => {
          row.work += work;
        },
      );
    },
  );
  const accelerated: IAutoMovieRecoveryFeasibleFit<number[]>[] = problems.map(
    (problem: IAutoMovieRecoveryFeasibleProblem<number[]>): IAutoMovieRecoveryFeasibleFit<number[]> => {
      const row: IRecoveryFeasibleObservation = { work: 0, checkpoints: 0 };
      observed.push(row);
      return refineRecoveryFeasibleState(problem, 100, 1e-8,
        { maxIterations: 10000, maxEntries: 10000, maxWork: 10000000 },
        (): void => { row.checkpoints++; }, (work: number): void => { row.work += work; },
        { maxSweeps: 64, minimumSingularRatio: 1e-8, maxEntries: 10000, maxResidentEntries: 10000, retainedEntries: 0, maxWork: 10000000 },
      );
    },
  );
  let lower: number = 0,
    upper: number = Math.PI / 6;
  for (let iteration: number = 0; iteration < 80; iteration++) {
    const theta: number = (lower + upper) / 2;
    const x: number = 2 * Math.cos(theta),
      y: number = 2 * Math.sin(theta);
    const derivative: number =
      (-3 * y * (x - 3)) / Math.hypot(1, x - 3) +
      (x * (y - 1)) / Math.hypot(1, y - 1);
    if (derivative < 0) lower = theta;
    else upper = theta;
  }
  const expected: number[][] = [
    [2],
    [0, 1],
    [2 * Math.cos((lower + upper) / 2), 2 * Math.sin((lower + upper) / 2)],
  ];
  const normalChecks: boolean[] = [...results, ...accelerated].map(
    (result: IAutoMovieRecoveryFeasibleFit<number[]>, at: number): boolean =>
        result.converged &&
          result.normalKktQualified &&
          result.termination === "kkt" &&
          result.state.every((value: number, axis: number): boolean =>
            nclose(value, expected[at % 3]![axis]!, 1e-5),
          ) &&
          problems[at % 3]!.evaluate(result.state) !== null &&
          result.finalCost < result.initialCost &&
          result.stationarity !== null &&
          result.complementarity !== null &&
          result.complementarity <= 1e-8 &&
          result.iterations === observed[at]!.checkpoints &&
          result.directionWork + result.trials.work === observed[at]!.work &&
          result.trials.baseline + result.trials.nominal + result.trials.numerical + result.trials.corrected + result.trials.half === result.iterations &&
          result.trials.qualifiedUnselected + result.trials.infeasible + result.trials.nondecreasing + result.trials.armijo === result.iterations - result.acceptedSteps,
  );
  const abnormalRows: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [-1], offset: 0 },
    { indices: [], values: [], offset: 0 },
  ];
  const abnormal: IAutoMovieRecoveryFeasibleFit<number[]> =
    refineRecoveryFeasibleState(
      {
        initial: [0],
        evaluate: (s: number[]): number | null => (s[0] === 0 ? -s[0]! : null),
        linearize: (): IAutoMovieRecoveryFeasibleModel => ({
          rows: abnormalRows,
          physicalRows: abnormalRows,
          width: 1,
          fromMetric: (step: readonly number[]): number[] => step.slice(),
        }),
        retract: (s: number[], d: readonly number[]): number[] => [
          s[0]! + d[0]!,
        ],
      },
      100,
      1e-8,
      { maxIterations: 100, maxEntries: 1000, maxWork: 10000 },
      (): void => {},
      (): void => {},
    );
  const exhausted: IAutoMovieRecoveryFeasibleFit<number[]> =
    refineRecoveryFeasibleState(
      problems[2]!,
      1,
      1e-8,
      { maxIterations: 10000, maxEntries: 10000, maxWork: 10000000 },
      (): void => {},
      (): void => {},
    );
  const incompleteCheck: boolean =
    !abnormal.converged &&
      abnormal.termination === "abnormal-or-stalled" &&
      !abnormal.normalKktQualified &&
      abnormal.acceptedSteps === 0 &&
      abnormal.stationarity === null &&
      !exhausted.converged &&
      exhausted.termination === "iteration-budget";
  const tangentCheck: boolean =
    [0.25, 0.5, 1].every(
      (step: number): boolean =>
        problems[1]!.evaluate([step, step]) === null &&
        problems[2]!.evaluate([2, step]) === null,
    );
  TestValidator.predicate(
    `complete analytic cases: ${JSON.stringify({ normal: results, accelerated, abnormal, exhausted })}`,
    normalChecks.every((value: boolean): boolean => value) && incompleteCheck && tangentCheck,
  );
}
