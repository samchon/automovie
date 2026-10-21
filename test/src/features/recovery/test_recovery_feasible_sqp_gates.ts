import { TestValidator } from "@nestia/e2e";

import { refineRecoveryFeasibleState } from "../../../../packages/recovery/src/internal/refineRecoveryFeasibleState";
import type { IAutoMovieRecoveryFeasibleFit } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleFit";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";

/**
 * Curvature support cannot bypass another row, actual cost or callback failure.
 *
 * Scenarios:
 * 1. The original two-trial ceiling stops after baseline/mixed full; a separate three-trial prefix reaches correction, whose unselected y^2 inequality still refuses it and preserves the initial state.
 * 2. Baseline and corrected full are feasible but increase authored cost, so their nondecreasing rejection precedes Armijo; mixed full instead fails the disk gate.
 * 3. Unavailable selected measurements retain a qualified baseline actual step without calling that step normal convergence; one remaining slot evaluates only the next baseline.
 * 4. Measurement failure after a qualified baseline retains its original error identity when a correction slot exists; two remaining slots never call the absent correction.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual controller, source pure-QP/complete-QP mixture, one-use correction and actual retraction/cost gates. The unchanged two-trial boundary and a distinct three-trial prefix distinguish exhausted correction support from an evaluated refused correction.
 * @evidence contracts/testing.md#independent-expectations At (2,0), c=.01, f=(0,-c), A=(1,0), H=I give pT=(-c^2,c)/(1+c^2). Its disk g=-3*c^2/(4*(1+c^2)) is negative but F(T)=c^2*(1-c^2)/(1+c^2)^2 is positive. The mixed y=c*(1-c^4/(1+c^2)) exceeds c/2 and selected-row SOC has delta_y=0, so corrected F=y*(2*y-c) is also positive. The outside row's zero derivative/slack.001 does not bind this model, but 10000*y^2 exceeds.001 at its actual trials.
 * @evidence contracts/testing.md#distinguishing-cases Separates selected-row correction, all-row nonlinear feasibility, nondecreasing actual cost, optional-support fallback, normal termination and unexpected callback error. The selector test separately distinguishes Armijo-only failure. No failed row or initial state is promoted to success.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_sqp_gates entry uses authored scalar arrays and maintained numerical functions, without files, processes, compiler, images, installation, browser or GPU.
 */
export function test_recovery_feasible_sqp_gates(): void {
  const initial: number[] = [2, 0];
  const original: string = JSON.stringify(initial);
  const marker: Error = new Error("selected-constraint-callback");
  const records: IAutoMovieRecoveryFeasibleFit<number[]>[] = [];
  const trials: number[] = [];
  const limits: number[] = [];
  let originalError: boolean = false;
  for (const limit of [2, 3]) for (const kind of ["outside", "cost", "unsupported", "throw"]) {
    let count: number = 0;
    const problem: IAutoMovieRecoveryFeasibleProblem<number[]> = {
      initial,
      evaluate: (state: number[]): number | null => {
        if ((state[0]! ** 2 + state[1]! ** 2) / 4 > 1 ||
          (kind === "outside" && 10000 * state[1]! ** 2 > 0.001)) return null;
        return -0.01 * state[1]! + (kind === "cost" ? 2 * state[1]! ** 2 : 0);
      },
      linearize: (state: number[]): ReturnType<IAutoMovieRecoveryFeasibleProblem<number[]>["linearize"]> => {
        const rows: ReturnType<IAutoMovieRecoveryFeasibleProblem<number[]>["linearize"]>["rows"] = [
          { indices: [0, 1], values: [0, -0.01 + (kind === "cost" ? 4 * state[1]! : 0)], offset: 0 },
          { indices: [0, 1], values: [state[0]! / 2, state[1]! / 2], offset: 1 - (state[0]! ** 2 + state[1]! ** 2) / 4 },
          ...(kind === "outside" ? [{ indices: [1], values: [20000 * state[1]!], offset: 0.001 - 10000 * state[1]! ** 2 }] : []),
        ];
        return {
          width: 2, rows, physicalRows: rows,
          fromMetric: (value: readonly number[]): number[] => value.slice(),
          toPhysicalCovector: (value: readonly number[]): number[] => value.slice(),
        };
      },
      retract: (state: number[], step: readonly number[]): number[] => [state[0]! + step[0]!, state[1]! + step[1]!],
      constraintValues: (state: number[], selected: readonly number[]): number[] | null => {
        if (kind === "throw") throw marker;
        if (kind === "unsupported") return null;
        return selected.map((row: number): number => row === 1 ? (state[0]! ** 2 + state[1]! ** 2) / 4 - 1 : 10000 * state[1]! ** 2 - 0.001);
      },
    };
    try {
      const fit: IAutoMovieRecoveryFeasibleFit<number[]> = refineRecoveryFeasibleState(problem, limit, 1e-8,
        { maxIterations: 10000, maxEntries: 10000, maxWork: 10000000 },
        (): void => { count++; }, (): void => {},
        { maxSweeps: 64, minimumSingularRatio: 1e-8, maxEntries: 10000, maxResidentEntries: 10000, retainedEntries: 0, maxWork: 10000000 },
      );
      records.push(fit);
      trials.push(count);
      limits.push(limit);
    } catch (error: unknown) {
      if (kind !== "throw" || limit !== 3) throw error;
      originalError = error === marker && count === 2;
    }
  }
  TestValidator.predicate(`complete original gates and actual trials: ${JSON.stringify(records)}`,
    records.length === 7 && originalError && JSON.stringify(initial) === original &&
    records.every((fit: IAutoMovieRecoveryFeasibleFit<number[]>, at: number): boolean =>
      !fit.converged && fit.iterations === limits[at] && trials[at] === limits[at] && fit.termination === "iteration-budget",
    ) &&
    [0, 1, 4, 5].every((at: number): boolean => records[at]!.acceptedSteps === 0 && records[at]!.state === initial) &&
    records[0]!.trials.infeasible === 2 && records[0]!.trials.corrected === 0 &&
    records[4]!.trials.infeasible === 3 && records[4]!.trials.corrected === 1 && records[4]!.lastSqp?.correctionSupported === true &&
    records[1]!.trials.infeasible === 1 && records[1]!.trials.nondecreasing === 1 && records[1]!.trials.armijo === 0 &&
    records[5]!.trials.infeasible === 1 && records[5]!.trials.nondecreasing === 2 && records[5]!.trials.armijo === 0 &&
    [2, 3, 6].every((at: number): boolean => records[at]!.acceptedSteps >= 1 &&
      records[at]!.state[0]! ** 2 + records[at]!.state[1]! ** 2 <= 4) &&
    records[2]!.trials.baseline === 1 && records[2]!.trials.nominal === 1 && records[2]!.acceptedSteps === 1 &&
    records[6]!.acceptedSteps === 2 && records[6]!.lastSqp?.reason === "trial-constraint-values-unavailable",
  );
}
