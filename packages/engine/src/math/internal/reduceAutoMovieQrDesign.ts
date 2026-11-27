import type {
  IAutoMovieQrDesignBudget,
  IAutoMovieQrDesignReduction,
} from "@automovie/interface";

import { overflowsBinary64 } from "./overflowsBinary64";

/*
 * Compress original least-squares rows by streaming Givens rotations. The
 * returned upper design and transformed right side preserve the variable
 * dependent objective; the remaining orthogonal residual is a constant term. No
 * normal matrix, pivot-based rank claim or inverse is formed. The caller must
 * qualify the compressed original design independently before solving.
 */
export function reduceAutoMovieQrDesign(
  rows: readonly (readonly number[])[],
  right: readonly number[],
  budget: IAutoMovieQrDesignBudget,
): IAutoMovieQrDesignReduction {
  const width: number = rows[0]?.length ?? 0;
  const retainedEntries: number = width * (width + 1);
  const work: number = rows.length * width * (width + 1);
  if (
    width < 1 ||
    rows.length < width ||
    right.length !== rows.length ||
    rows.length * width > budget.maxEntries ||
    retainedEntries > budget.maxEntries ||
    work > budget.maxWork
  )
    throw new Error(
      "qr-design: finite rectangular rows and bounded work required",
    );
  for (const row of rows)
    if (row.length !== width)
      throw new Error("qr-design: finite rectangular rows required");
  const upper: number[][] = Array.from({ length: width }, (): number[] =>
    new Array<number>(width + 1).fill(0),
  );
  let orthogonalResidualNorm: number = 0;
  let transformedCells: number = 0;
  for (let at: number = 0; at < rows.length; at++) {
    const incoming: number[] = [...rows[at]!, right[at]!];
    for (let column: number = 0; column < width; column++) {
      const b: number = incoming[column]!;
      if (b === 0) continue;
      const a: number = upper[column]![column]!;
      const norm: number = Math.hypot(a, b);
      if (!(norm > 0) || overflowsBinary64(norm))
        throw new Error("qr-design: unrepresentable orthogonal rotation");
      const cosine: number = a / norm;
      const sine: number = b / norm;
      for (let entry: number = column; entry <= width; entry++) {
        const first: number = upper[column]![entry]!;
        const second: number = incoming[entry]!;
        const retained: number = cosine * first + sine * second;
        const remaining: number = -sine * first + cosine * second;
        if (overflowsBinary64(retained) || overflowsBinary64(remaining))
          throw new Error("qr-design: unrepresentable transformed cell");
        upper[column]![entry] = retained;
        incoming[entry] = remaining;
        transformedCells++;
      }
      incoming[column] = 0;
    }
    orthogonalResidualNorm = Math.hypot(
      orthogonalResidualNorm,
      incoming[width]!,
    );
    if (overflowsBinary64(orthogonalResidualNorm))
      throw new Error("qr-design: unrepresentable orthogonal residual");
  }
  return {
    rows: upper.map((row: number[]): number[] => row.slice(0, width)),
    right: upper.map((row: number[]): number => row[width]!),
    orthogonalResidualNorm,
    transformedCells,
  };
}
