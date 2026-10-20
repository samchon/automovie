import type { IAutoMovieQrDesignBudget } from "./IAutoMovieQrDesignBudget";
import type { IAutoMovieQrDesignReduction } from "./IAutoMovieQrDesignReduction";

/**
 * Compress original least-squares rows by streaming Givens rotations.
 * The returned upper design and transformed right side preserve the variable
 * dependent objective; the remaining orthogonal residual is a constant term.
 * No normal matrix, pivot-based rank claim or inverse is formed. The caller
 * must qualify the compressed original design independently before solving.
 *
 * @evidence contracts/common.md#principled-implementation Orthogonal two-row rotations eliminate each incoming row against a retained upper triangle, preserving least-squares singular values and variable-dependent residuals without squaring condition numbers. Hypot supplies finite rotations; unrepresentable actions throw.
 * @evidence contracts/common.md#clear-and-simple-design This generic algebra owner compresses rows only; numerical rank, scaling, damping and nonlinear acceptance remain with its consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal equations, diagonal floor, invented rank, dropped nonconstant residual or fixture-specific branch substitutes for orthogonal elimination.
 * @evidence contracts/common.md#meaningful-documentation States original-row semantics, unchanged variable coordinates, constant discarded residual, independent rank responsibility and safe-integer entry/work admission.
 * @evidence contracts/performance.md#efficient-algorithms For m rows and n columns, at most m*n*(n+1) transformed cells cost O(m*n^2); retained storage is O(n^2). This removes the tall dimension before a consumer's small square SVD, without claiming a measured speedup.
 * @evidence contracts/performance.md#reuse-equivalent-work Each rotation updates the design and right side together; one upper triangle accumulates all rows without retaining a full orthogonal basis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Admitted owned upper rows/right transfer to the caller. A single incoming row and scratch expire on return or throw without mutating input, globals or external resources.
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
    !right.every(Number.isFinite) ||
    !Number.isSafeInteger(budget?.maxEntries) ||
    !Number.isSafeInteger(budget.maxWork) ||
    !Number.isSafeInteger(rows.length * width) ||
    !Number.isSafeInteger(retainedEntries) ||
    !Number.isSafeInteger(work) ||
    rows.length * width > budget.maxEntries ||
    retainedEntries > budget.maxEntries ||
    work > budget.maxWork
  )
    throw new Error(
      "qr-design: finite rectangular rows and bounded work required",
    );
  for (const row of rows)
    if (row.length !== width || !row.every(Number.isFinite))
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
      if (!(norm > 0) || !Number.isFinite(norm))
        throw new Error("qr-design: unrepresentable orthogonal rotation");
      const cosine: number = a / norm;
      const sine: number = b / norm;
      for (let entry: number = column; entry <= width; entry++) {
        const first: number = upper[column]![entry]!;
        const second: number = incoming[entry]!;
        const retained: number = cosine * first + sine * second;
        const remaining: number = -sine * first + cosine * second;
        if (!Number.isFinite(retained) || !Number.isFinite(remaining))
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
    if (!Number.isFinite(orthogonalResidualNorm))
      throw new Error("qr-design: unrepresentable orthogonal residual");
  }
  return {
    rows: upper.map((row: number[]): number[] => row.slice(0, width)),
    right: upper.map((row: number[]): number => row[width]!),
    orthogonalResidualNorm,
    transformedCells,
  };
}
