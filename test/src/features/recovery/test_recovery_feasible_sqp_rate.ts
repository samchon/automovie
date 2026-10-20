import { TestValidator } from "@nestia/e2e";

import { refineRecoveryFeasibleState } from "../../../../packages/recovery/src/internal/refineRecoveryFeasibleState";
import type { IAutoMovieRecoveryFeasibleFit } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleFit";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";
import { nclose } from "../internal/nclose";

/**
 * Fixed inward tilt and physical-norm SQP mixing have distinct exact rates.
 *
 * Scenarios:
 * 1. F=-a*x, g=x<=0, x0=-1/2, a=1 or9, H=1 has the original two-active-branch recurrence s_next=a*s/(1+a).
 * 2. A certified untilted physical step is s; resolved nominal mixing gives s_next=a*s^3/(1+a), including H=1/4. At rounding-scale slack a numerical-support or retained-baseline coefficient stays on the same independently determined segment.
 * 3. Baseline a=1 can certify its 26th accepted endpoint without a 27th trial; a=9 remains incomplete at100. Acceleration retains the same physical KKT and trial limit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual source nonlinear controller, pure direction solver and optional complete-affine-QP/SQP selection. Observes every actual evaluation and each accepted model separately within100; qualified unselected comparisons consume trials without creating a recurrence step.
 * @evidence contracts/testing.md#independent-expectations Solving the two affine KKT equalities gives d_T=s/(1+a), d_S=s and rho=s^2. The exact linear/cubic recurrences and original stationarity h*s/(1+h*s/(1+a)), complementarity (a-h*s/(1+a))*s/(1+h*s/(1+a)) determine expectations independently of source output.
 * @evidence contracts/testing.md#distinguishing-cases Objective scaling changes fixed-tilt rate; a changed positive metric distinguishes physical from whitened mixing norms. Every trial remains feasible, normal success requires original physical KKT, and a refused baseline remains refused without threshold or iteration changes.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_sqp_rate entry runs resident one-dimensional arrays without images, files, processes, compiler, native build, browser or GPU.
 */
export function test_recovery_feasible_sqp_rate(): void {
  const checks: boolean[] = [];
  const records: IAutoMovieRecoveryFeasibleFit<number>[][] = [];
  for (const pair of [[1, 1], [9, 1], [9, 0.25]]) {
    const a: number = pair[0]!, h: number = pair[1]!, root: number = Math.sqrt(h);
    const fits: IAutoMovieRecoveryFeasibleFit<number>[] = [];
    for (const accelerated of [false, true]) {
      const states: number[] = [], evaluations: number[] = [];
      let trials: number = 0, measurements: number = 0;
      const problem: IAutoMovieRecoveryFeasibleProblem<number> = {
        initial: -0.5,
        evaluate: (state: number): number | null => { evaluations.push(state); return state <= 0 ? -a * state : null; },
        linearize: (state: number): ReturnType<IAutoMovieRecoveryFeasibleProblem<number>["linearize"]> => { states.push(state); return {
          width: 1,
          rows: [{ indices: [0], values: [-a / root], offset: 0 }, { indices: [0], values: [1 / root], offset: -state }],
          physicalRows: [{ indices: [0], values: [-a], offset: 0 }, { indices: [0], values: [1], offset: -state }],
          fromMetric: (value: readonly number[]): number[] => [value[0]! / root],
          toPhysicalCovector: (value: readonly number[]): number[] => [value[0]! * root],
        }; },
        retract: (state: number, step: readonly number[]): number => state + step[0]!,
        constraintValues: (state: number, selected: readonly number[]): number[] => { measurements++; return selected.map((): number => state); },
      };
      const fit: IAutoMovieRecoveryFeasibleFit<number> = refineRecoveryFeasibleState(problem, 100, 1e-8,
        { maxIterations: 10000, maxEntries: 10000, maxWork: 10000000 },
        (): void => { trials++; }, (): void => {},
        accelerated ? { maxSweeps: 64, minimumSingularRatio: 1e-8, maxEntries: 10000, maxResidentEntries: 10000, retainedEntries: 0, maxWork: 10000000 } : undefined,
      );
      fits.push(fit);
      checks.push(fit.iterations === fit.acceptedSteps + fit.trials.qualifiedUnselected && trials === fit.iterations && measurements === 0 &&
        evaluations.length === fit.iterations + 1 && evaluations.every((value: number): boolean => value <= 0) &&
        states.length === fit.acceptedSteps + 1 && states.every((value: number): boolean => value <= 0) &&
        states.slice(1).every((state: number, at: number): boolean => {
          const s: number = -states[at]!;
          const expected: number = accelerated ? -(a / (1 + a)) * s ** 3 : -(a / (1 + a)) * s;
          const allowance: number = 64 * Number.EPSILON * (1 + a + h);
          const baseline: number = -(a / (1 + a)) * s;
          return h * s < a && h * s / (1 + a) < a &&
            (nclose(state, expected, allowance) || (accelerated && Math.abs(expected) <= allowance && state >= baseline - allowance && state <= expected + allowance));
        }));
      if (accelerated) checks.push(fit.converged && fit.normalKktQualified && fit.termination === "kkt" && fit.iterations < 26 &&
        fit.stationarity! <= 1e-8 * a && fit.complementarity! <= 1e-8);
      else checks.push(a === 1 ? fit.converged && fit.iterations === 26 : !fit.converged && fit.termination === "iteration-budget" && fit.iterations === 100);
    }
    records.push(fits);
  }
  TestValidator.predicate(`physical boundary rates: ${JSON.stringify(records)}`, checks.every((value: boolean): boolean => value));
}
