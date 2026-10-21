import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import { reduceAutoMovieQrDesign } from "@automovie/engine/math/reduceAutoMovieQrDesign";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapDesignFactor } from "../structures/internal/IAutoMovieRecoveryMapDesignFactor";

/**
 * Qualify the original column-normalized design without synthesizing an answer.
 *
 * @evidence contracts/common.md#principled-implementation The unchanged positive column scales, tall-design Givens compression and original-design SVD measure undamped rank; row order, sweeps and orthogonality tolerance are preserved.
 * @evidence contracts/common.md#clear-and-simple-design Full LS solving and rank-only metric consumption share original factorization, with no dummy step or gradient.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Gram matrix, pivot floor, damped rank or unconverged SVD provides qualification; invalid rows/right and nonrepresentable QR/SVD propagate.
 * @evidence contracts/common.md#meaningful-documentation Returned rows and factors use normalized columns; short designs alias their original right while tall designs own the compressed right. Callers release the whole record before unrelated scalable phases when they only need its ratio.
 * @evidence contracts/performance.md#efficient-algorithms Tall compression costs O(m*C^2), square rank SVD O(S*C^3), with O(m*C+C^2) admitted storage. No gradient or LS step is synthesized.
 * @evidence contracts/performance.md#reuse-equivalent-work The ordinary solver reuses these exact arrays for its requested step. Metric-only construction immediately consumes the ratio instead of solving an unused LS problem.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned rows/scales/SVD arrays transfer for one operation; solveRows can alias rows and short solveRight borrows input. No cache or external resource remains.
 */
export function factorRecoveryMapDesign(
  design: readonly (readonly number[])[],
  right: readonly number[],
  minimumRatio: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapDesignFactor {
  const width: number = design[0]?.length ?? 0;
  if (
    width < 1 ||
    design.length !== right.length ||
    !right.every(Number.isFinite) ||
    (design.length + width) * width > budget.maxLinearEntries ||
    width * width > budget.maxLinearEntries
  )
    throw new Error(
      "camera-map: inadmissible local design dimensions or damping",
    );
  const scales: number[] = new Array<number>(width).fill(0);
  for (const row of design) {
    if (row.length !== width || !row.every(Number.isFinite))
      throw new Error("camera-map: finite rectangular local design required");
    for (let column: number = 0; column < width; column++)
      scales[column] = Math.hypot(scales[column]!, row[column]!);
  }
  if (
    scales.some(
      (value: number): boolean => !(value > 0) || !Number.isFinite(value),
    )
  )
    throw new Error("camera-map: unresolved local direction");
  const rows: number[][] = design.map((row: readonly number[]): number[] =>
    row.map((value: number, at: number): number => value / scales[at]!),
  );
  const options: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: budget.maxLinearEntries,
    maxSweeps: budget.maxSingularSweeps,
    orthogonalityTolerance: 1e-12,
  };
  const compressed: ReturnType<typeof reduceAutoMovieQrDesign> | null =
    rows.length >= 2 * width
      ? reduceAutoMovieQrDesign(rows, right, {
          maxEntries: budget.maxLinearEntries,
          maxWork: rows.length * width * (width + 1),
        })
      : null;
  const solveRows: number[][] = compressed?.rows ?? rows;
  const solveRight: readonly number[] = compressed?.right ?? right;
  const rank: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(solveRows, options);
  const designRatio: number =
    rank.singularValues[width - 1]! / rank.singularValues[0]!;
  if (!(designRatio >= minimumRatio))
    throw new Error("camera-map: rank-degenerate local design");
  return { scales, rows, solveRows, solveRight, rank, designRatio };
}
