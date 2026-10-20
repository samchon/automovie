import type { IAutoMovieSingularDecomposition } from "./IAutoMovieSingularDecomposition";

/**
 * Decompose original rows by cyclic one-sided Jacobi column rotations.
 * The method rotates A and accumulates V; it never forms A transpose A.
 * A common maximum-entry scale protects the ordinary pair dot products.
 * Numerical null columns remain in V, including when there are fewer rows than
 * columns. Their left directions and relative accuracy remain unresolved.
 * This bounded kernel does not implement LAPACK's preconditioning, scaled-pair
 * rotations or high-relative-accuracy guarantees for extreme column disparities.
 * The one-sided construction is described by LAPACK DGESVJ:
 * https://www.netlib.org/lapack/lapack_routine/dgesvj.f
 *
 * @evidence contracts/common.md#principled-implementation Jacobi rotations orthogonalize columns of the original scaled design and accumulate its right basis, avoiding condition squaring. A reported floating null cutoff excludes unresolvable tiny columns from convergence tests without erasing their computed norms; nonconvergence, unrepresentable factors or excessive measured reconstruction error throws.
 * @evidence contracts/common.md#clear-and-simple-design One bounded factorization supplies least-squares and homogeneous right-null directions; admission, rotations and final measured reconstruction stay in this numerical owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal-matrix eigensolver, rank-restoring ridge, fixture branch or nonconverged fallback is used. The caller selects work and orthogonality budgets, while numerical-null limitations remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Defines row input and column output, original units, maximum-entry scaling, numerical-null limits, LAPACK's method basis and every throwing condition.
 * @evidence contracts/performance.md#efficient-algorithms For m rows, n columns and s sweeps, pair rotations cost O(s*m*n^2+s*n^3), and measured reconstruction costs O(m*n^2). Entry and sweep budgets bound dense work before allocation; this small-design kernel is not a large-matrix driver.
 * @evidence contracts/performance.md#reuse-equivalent-work Each pair's dot products determine both data and right-basis rotations; the final columns supply singular norms and reconstruction without another decomposition. Borrowed mutable input prevents cross-call reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All O(m*n+n^2) arrays are call-local and the returned factors transfer to the caller. Admission precedes allocation; throwing retains no cache, process or external handle.
 */
export function decomposeAutoMovieSingularMatrix(
  rows: readonly (readonly number[])[],
  budget: {
    /** Maximum entries in each of the input and square right-basis arrays, separately. */
    maxEntries: number;

    /** Positive maximum complete cyclic sweeps, including the final convergence check. */
    maxSweeps: number;

    /** Relative active-column correlation threshold, from 64 machine epsilons through .01. */
    orthogonalityTolerance: number;
  },
): IAutoMovieSingularDecomposition {
  const height: number = rows.length;
  const width: number = rows[0]?.length ?? 0;
  if (
    !Number.isSafeInteger(budget?.maxEntries) || budget.maxEntries < 1 ||
    !Number.isSafeInteger(budget.maxSweeps) || budget.maxSweeps < 1 ||
    !Number.isFinite(budget.orthogonalityTolerance) ||
    budget.orthogonalityTolerance < 64 * Number.EPSILON ||
    budget.orthogonalityTolerance > 0.01 ||
    height < 1 || width < 1 ||
    !Number.isSafeInteger(height * width) ||
    height * width > budget.maxEntries || width * width > budget.maxEntries
  ) throw new Error("singular-matrix: nonempty dimensions and finite work budgets required");
  let scale: number = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== width)
      throw new Error("singular-matrix: rectangular rows required");
    for (const value of row) {
      if (!Number.isFinite(value))
        throw new Error("singular-matrix: finite entries required");
      scale = Math.max(scale, Math.abs(value));
    }
  }
  const columns: number[][] = Array.from(
    { length: width },
    (_: unknown, column: number): number[] => rows.map(
      (row: readonly number[]): number => scale === 0 ? 0 : row[column]! / scale,
    ),
  );
  const right: number[][] = Array.from(
    { length: width },
    (_: unknown, column: number): number[] => Array.from(
      { length: width },
      (_value: unknown, row: number): number => row === column ? 1 : 0,
    ),
  );
  const nullCutoff: number = 8 * Number.EPSILON * Math.max(height, width);
  const norm: (column: readonly number[]) => number = (
    column: readonly number[],
  ): number => {
    let value: number = 0;
    for (const entry of column) value = Math.hypot(value, entry);
    return value;
  };
  let sweeps: number = 0;
  let maximumCorrelation: number = 0;
  let converged: boolean = scale === 0 || width === 1;
  for (; sweeps < budget.maxSweeps && !converged; sweeps++) {
    maximumCorrelation = 0;
    let largestSquaredNorm: number = 0;
    for (const column of columns) {
      let squared: number = 0;
      for (const value of column) squared += value * value;
      largestSquaredNorm = Math.max(largestSquaredNorm, squared);
    }
    const inactiveSquared: number = largestSquaredNorm * nullCutoff * nullCutoff;
    let rotated: boolean = false;
    for (let first: number = 0; first < width; first++) {
      for (let second: number = first + 1; second < width; second++) {
        const a: number[] = columns[first]!;
        const b: number[] = columns[second]!;
        let aa: number = 0, bb: number = 0, ab: number = 0;
        for (let row: number = 0; row < height; row++) {
          aa += a[row]! * a[row]!;
          bb += b[row]! * b[row]!;
          ab += a[row]! * b[row]!;
        }
        if (aa <= inactiveSquared || bb <= inactiveSquared) continue;
        const correlation: number = Math.abs(ab) / Math.sqrt(aa) / Math.sqrt(bb);
        maximumCorrelation = Math.max(maximumCorrelation, correlation);
        if (correlation <= budget.orthogonalityTolerance) continue;
        const difference: number = bb - aa;
        // The small root of t^2 + ((bb-aa)/ab)t - 1 = 0 avoids
        // a subtraction of nearby values and never needs a squared ratio.
        const denominator: number = difference +
          (difference < 0 ? -1 : 1) * Math.hypot(difference, 2 * ab);
        const tangent: number = denominator === 0 ? 1 : 2 * ab / denominator;
        const cosine: number = 1 / Math.hypot(1, tangent);
        const sine: number = cosine * tangent;
        for (let row: number = 0; row < height; row++) {
          const x: number = a[row]!, y: number = b[row]!;
          a[row] = cosine * x - sine * y;
          b[row] = sine * x + cosine * y;
        }
        for (let row: number = 0; row < width; row++) {
          const x: number = right[first]![row]!, y: number = right[second]![row]!;
          right[first]![row] = cosine * x - sine * y;
          right[second]![row] = sine * x + cosine * y;
        }
        rotated = true;
      }
    }
    converged = !rotated;
  }
  if (!converged)
    throw new Error("singular-matrix: orthogonality sweep budget exhausted");
  const lengths: number[] = columns.map(norm);
  const order: number[] = Array.from(
    { length: width }, (_: unknown, index: number): number => index,
  ).sort((a: number, b: number): number => lengths[b]! - lengths[a]! || a - b);
  const singularValues: number[] = order.map(
    (column: number): number => lengths[column]! * scale,
  );
  if (!singularValues.every(Number.isFinite))
    throw new Error("singular-matrix: singular values are not representable");
  const leftColumns: number[][] = [];
  const rightColumns: number[][] = [];
  for (const column of order) {
    let anchor: number = 0;
    for (let row: number = 1; row < width; row++)
      if (Math.abs(right[column]![row]!) > Math.abs(right[column]![anchor]!)) anchor = row;
    const sign: number = right[column]![anchor]! < 0 ? -1 : 1;
    rightColumns.push(right[column]!.map((value: number): number => sign * value));
    leftColumns.push(columns[column]!.map(
      (value: number): number => lengths[column] === 0 ? 0 : sign * value / lengths[column]!,
    ));
  }
  let errorNorm: number = 0, originalNorm: number = 0;
  for (let row: number = 0; row < height; row++) {
    for (let column: number = 0; column < width; column++) {
      let reconstructed: number = 0;
      for (let index: number = 0; index < width; index++)
        reconstructed += leftColumns[index]![row]! * lengths[order[index]!]! * rightColumns[index]![column]!;
      const original: number = scale === 0 ? 0 : rows[row]![column]! / scale;
      errorNorm = Math.hypot(errorNorm, reconstructed - original);
      originalNorm = Math.hypot(originalNorm, original);
    }
  }
  const relativeResidual: number = originalNorm === 0 ? 0 : errorNorm / originalNorm;
  if (!Number.isFinite(relativeResidual) || relativeResidual > 8 * budget.orthogonalityTolerance)
    throw new Error("singular-matrix: measured reconstruction residual exceeds budget");
  return {
    singularValues, leftColumns, rightColumns,
    numericalRank: lengths.filter((value: number): boolean => value > nullCutoff * lengths[order[0]!]!).length,
    relativeNullCutoff: nullCutoff, sweeps,
    orthogonalityTolerance: budget.orthogonalityTolerance,
    maximumActiveColumnCorrelation: maximumCorrelation,
    relativeReconstructionResidual: relativeResidual,
  };
}
