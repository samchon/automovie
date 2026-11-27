import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryMapDesignFactor,
  IAutoMovieRecoveryMapDesignSolutionOperation,
} from "@automovie/interface";

import { factorRecoveryMapDesign } from "./factorRecoveryMapDesign";

/*
 * Solve a column-scaled original least-squares design with optional damping.
 * Independent undamped rank is checked first; damping controls a step and never
 * supplies evidence of local observability. The right side is minus residual.
 */
export function solveRecoveryMapDesign(
  design: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[0],
  right: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[1],
  minimumRatio: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[2],
  damping: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[3],
  budget: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[4],
): ReturnType<IAutoMovieRecoveryMapDesignSolutionOperation.Operation> {
  if (!(damping >= 0))
    throw new Error(
      "camera-map: inadmissible local design dimensions or damping",
    );
  const factor: IAutoMovieRecoveryMapDesignFactor = factorRecoveryMapDesign(
    design,
    right,
    minimumRatio,
    budget,
  );
  const width: number = factor.scales.length;
  const scales: number[] = factor.scales;
  const rows: number[][] = factor.rows;
  const solveRows: number[][] = factor.solveRows;
  const solveRight: readonly number[] = factor.solveRight;
  const rank: IAutoMovieRecoveryMapDesignFactor["rank"] = factor.rank;
  const designRatio: number = factor.designRatio;
  const options: Parameters<typeof AutoMovieEngineMath.decomposeSingularMatrix>[1] = {
    maxEntries: budget.maxLinearEntries,
    maxSweeps: budget.maxSingularSweeps,
    orthogonalityTolerance: 1e-12,
  };
  let gradient: number = 0;
  for (let column: number = 0; column < width; column++)
    gradient = Math.max(
      gradient,
      Math.abs(
        rows.reduce(
          (sum: number, row: number[], at: number): number =>
            sum + row[column]! * right[at]!,
          0,
        ),
      ),
    );
  const augmented: number[][] = solveRows.slice();
  if (damping > 0)
    for (let row: number = 0; row < width; row++)
      augmented.push(
        Array.from({ length: width }, (_: unknown, at: number): number =>
          at === row ? Math.sqrt(damping) : 0,
        ),
      );
  const factors: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
    damping === 0 ? rank : AutoMovieEngineMath.decomposeSingularMatrix(augmented, options);
  const step: number[] = new Array<number>(width).fill(0);
  for (let component: number = 0; component < width; component++) {
    const coefficient: number =
      solveRight.reduce(
        (sum: number, value: number, at: number): number =>
          sum + factors.leftColumns[component]![at]! * value,
        0,
      ) / factors.singularValues[component]!;
    for (let at: number = 0; at < width; at++)
      step[at] +=
        (coefficient * factors.rightColumns[component]![at]!) / scales[at]!;
  }
  return { step, designRatio, gradient };
}
