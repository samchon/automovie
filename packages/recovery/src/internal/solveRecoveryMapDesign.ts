import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import { factorRecoveryMapDesign } from "./factorRecoveryMapDesign";
import type { IAutoMovieRecoveryMapDesignFactor } from "../structures/internal/IAutoMovieRecoveryMapDesignFactor";
import type { IAutoMovieRecoveryMapDesignFit } from "../structures/internal/IAutoMovieRecoveryMapDesignFit";

/**
 * Solve a column-scaled original least-squares design with optional damping.
 * Independent undamped rank is checked first; damping controls a step and never
 * supplies evidence of local observability. The right side is minus residual.
 *
 * @evidence contracts/common.md#principled-implementation Scaling columns preserves physical parameter units on back substitution. Tall original designs are compressed by orthogonal Givens QR before SVD measures the same singular spectrum. An augmented identity design implements Levenberg damping without squaring condition or changing the least-squares step.
 * @evidence contracts/common.md#clear-and-simple-design Shared original factorization serves this complete resection/joint LS operation and a separate metric-only operation; model derivatives, robust loss and actual acceptance remain with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal-equation inverse, singular floor, damped-rank claim or unconverged decomposition supplies a step.
 * @evidence contracts/common.md#meaningful-documentation States right-side sign, unscaled returned coordinates, dimensionless damping, original rank and preallocation entry bound.
 * @evidence contracts/performance.md#efficient-algorithms For m rows and n parameters, tall QR costs O(m*n^2), followed by square original-design SVDs costing O(S*n^3), with O(m*n+n^2) storage. Variable camera width remains explicitly bounded; compression supplies no measured host-speed guarantee.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared original factors alias the same normalized/QR arrays for gradient and answer synthesis. Column norms restore units, and zero damping reuses the independently qualified SVD.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned step and scalar diagnostics return; call-local factors expire with no mutable global cache or external resource.
 */
export function solveRecoveryMapDesign(
  design: readonly (readonly number[])[],
  right: readonly number[],
  minimumRatio: number,
  damping: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapDesignFit {
  if (!(damping >= 0) || !Number.isFinite(damping))
    throw new Error("camera-map: inadmissible local design dimensions or damping");
  const factor: IAutoMovieRecoveryMapDesignFactor = factorRecoveryMapDesign(design, right, minimumRatio, budget);
  const width: number = factor.scales.length;
  const scales: number[] = factor.scales;
  const rows: number[][] = factor.rows;
  const solveRows: number[][] = factor.solveRows;
  const solveRight: readonly number[] = factor.solveRight;
  const rank: IAutoMovieRecoveryMapDesignFactor["rank"] = factor.rank;
  const designRatio: number = factor.designRatio;
  const options: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: budget.maxLinearEntries, maxSweeps: budget.maxSingularSweeps, orthogonalityTolerance: 1e-12,
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
  const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    damping === 0 ? rank : decomposeAutoMovieSingularMatrix(augmented, options);
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
  if (!step.every(Number.isFinite))
    throw new Error("camera-map: nonrepresentable local step");
  return { step, designRatio, gradient };
}
