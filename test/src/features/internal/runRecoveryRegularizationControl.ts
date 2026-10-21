import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import { refineRecoveryFeasibleState } from "../../../../packages/recovery/src/internal/refineRecoveryFeasibleState";
import { updateRecoveryRegularization } from "../../../../packages/recovery/src/internal/updateRecoveryRegularization";
import type { IAutoMovieRecoveryFeasibleModel } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";
import type { AutoRecoveryRegularizationMode } from "./AutoRecoveryRegularizationMode";
import type { IRecoveryRegularizationObservation } from "./IRecoveryRegularizationObservation";

/** Use the source chosen-increment hook on the fixed original-q quadratic family. */
export function runRecoveryRegularizationControl(
  epsilon: number,
  mode: AutoRecoveryRegularizationMode,
): IRecoveryRegularizationObservation {
  let coefficient: number = mode === "oracle" ? 0 : 1e-3;
  let modelBase: number[] | null = null, gradient: number[] = [];
  const observed: IRecoveryRegularizationObservation = {
    fit: null!, damping: [], reactions: [], work: 0, checkpoints: 0, evaluations: 0,
  };
  const charge: (amount: number) => void = (amount: number): void => {
    observed.work += amount;
    if (observed.work > 1e9) throw new Error("analytic aggregate work exhausted");
  };
  const cost: (q: readonly number[]) => number = (q: readonly number[]): number => {
    const first: number = q[0]! + q[1]! - Math.SQRT2 * 0.5;
    const second: number = epsilon * (q[0]! - q[1]!);
    return 0.5 * (first * first + second * second);
  };
  const initial: number[] = [0.25 / Math.SQRT2, -0.25 / Math.SQRT2];
  charge(65536);
  const problem: IAutoMovieRecoveryFeasibleProblem<number[]> = {
    initial,
    evaluate: (q: number[]): number | null => {
      charge(512);
      observed.evaluations++;
      return q[0]! + q[1]! <= 0 ? cost(q) : null;
    },
    linearize: (q: number[]): IAutoMovieRecoveryFeasibleModel => {
      charge(16384);
      if (observed.damping.length >= 101) throw new Error("analytic model horizon exhausted");
      observed.damping.push(coefficient);
      const first: number = q[0]! + q[1]! - Math.SQRT2 * 0.5;
      const second: number = epsilon * (q[0]! - q[1]!);
      gradient = [first + epsilon * second, first - epsilon * second];
      modelBase = q;
      const hn: number = 2 + coefficient * (1 + epsilon * epsilon);
      const ht: number = 2 * epsilon * epsilon + coefficient * (1 + epsilon * epsilon);
      const sn: number = Math.sqrt(hn), st: number = Math.sqrt(ht);
      const physicalRows: IAutoMovieSimplexAtom[] = [
        { indices: [0, 1], values: gradient, offset: 0 },
        { indices: [0, 1], values: [1 / Math.SQRT2, 1 / Math.SQRT2], offset: -(q[0]! + q[1]!) / Math.SQRT2 },
      ];
      return {
        width: 2, physicalRows,
        rows: physicalRows.map((row: IAutoMovieSimplexAtom): IAutoMovieSimplexAtom => ({
          indices: [0, 1], offset: row.offset,
          values: [(row.values[0]! + row.values[1]!) / Math.SQRT2 / sn,
            (row.values[0]! - row.values[1]!) / Math.SQRT2 / st],
        })),
        fromMetric: (z: readonly number[]): number[] => [
          (z[0]! / sn + z[1]! / st) / Math.SQRT2,
          (z[0]! / sn - z[1]! / st) / Math.SQRT2,
        ],
        toPhysicalCovector: (z: readonly number[]): number[] => [
          (z[0]! * sn + z[1]! * st) / Math.SQRT2,
          (z[0]! * sn - z[1]! * st) / Math.SQRT2,
        ],
      };
    },
    retract: (q: number[], increment: readonly number[]): number[] => {
      charge(512);
      return [q[0]! + increment[0]!, q[1]! + increment[1]!];
    },
    constraintValues: (q: number[], selected: readonly number[]): number[] => {
      charge(512);
      if (selected.length !== 1 || selected[0] !== 1) throw new Error("original constraint row required");
      return [(q[0]! + q[1]!) / Math.SQRT2];
    },
    accepted: mode === "agreement" ? (
      base: number[], u: readonly number[], oldCost: number, newCost: number,
    ): void => {
      charge(128);
      if (base !== modelBase || oldCost !== cost(base)) throw new Error("current-base cost required");
      const first: number = u[0]! + u[1]!, second: number = epsilon * (u[0]! - u[1]!);
      const prediction: number = -gradient[0]! * u[0]! - gradient[1]! * u[1]! - 0.5 * (first * first + second * second);
      const update: ReturnType<typeof updateRecoveryRegularization> = updateRecoveryRegularization(coefficient, oldCost - newCost, prediction);
      observed.reactions.push(update);
      coefficient = update.damping;
      modelBase = null;
      gradient = [];
    } : undefined,
  };
  observed.fit = refineRecoveryFeasibleState(problem, 100, 1e-8,
    { maxIterations: 10000, maxEntries: 100000, maxWork: 10000000 },
    (): void => { observed.checkpoints++; }, charge,
    { maxSweeps: 64, minimumSingularRatio: 1e-8, maxEntries: 100000,
      maxResidentEntries: 100000, retainedEntries: 65536, maxWork: 10000000 });
  return observed;
}
