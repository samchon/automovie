import {
  decomposeAutoMovieSingularMatrix,
  reduceAutoMovieQrDesign,
} from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapDesignFactor,
} from "@automovie/interface";

/** Qualify the original column-normalized design without synthesizing an answer. */
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
    (design.length + width) * width > budget.maxLinearEntries ||
    width * width > budget.maxLinearEntries
  )
    throw new Error(
      "camera-map: inadmissible local design dimensions or damping",
    );
  const scales: number[] = new Array<number>(width).fill(0);
  for (const row of design) {
    if (row.length !== width)
      throw new Error("camera-map: finite rectangular local design required");
    for (let column: number = 0; column < width; column++)
      scales[column] = Math.hypot(scales[column]!, row[column]!);
  }
  if (scales.some((value: number): boolean => !(value > 0)))
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
