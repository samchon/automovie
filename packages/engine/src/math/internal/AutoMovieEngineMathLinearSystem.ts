/*
 * Dense linear-system preparation and solution kernels.
 */
export namespace AutoMovieEngineMathLinearSystem {
/*
 * Factor an unchanged square matrix for repeated right-hand sides using
 * partial-pivot Gaussian elimination. Inputs must be finite, square and
 * consistently scaled with representable intermediate arithmetic. A pivot no
 * greater than 1e-14 times the largest original entry returns null, the
 * existing dense solver's rejection rule rather than a rank certificate.
 *
 * The returned solver replays the same row swaps and elimination factors on
 * each copied right-hand side, then performs back substitution in descending
 * row order. Its arithmetic for every right-hand side is the augmented Gaussian
 * solve's original arithmetic, including strict pivot ties and subtraction
 * order. The source matrix may change after preparation because the factor owns
 * its copied coefficients; prepare again to adopt changes.
 * Parameter rows: Matrix entries by rows, not modified.
 * Returns: A solver returning fresh solution arrays, or null at the pivot gate.
 */
export function prepare(
  rows: readonly (readonly number[])[],
): ((right: readonly number[]) => number[]) | null {
  const size: number = rows.length;
  const matrix: number[][] = rows.map((row: readonly number[]): number[] => [
    ...row,
  ]);
  const pivots: number[] = [];
  const factors: number[][] = [];
  if (!eliminate(matrix, size, largestEntry(rows), pivots, factors))
    return null;

  return (right: readonly number[]): number[] => {
    const column: number[] = [...right];
    for (let index: number = 0; index < size; ++index) {
      const pivot: number = pivots[index]!;
      [column[index], column[pivot]] = [column[pivot]!, column[index]!];
      const multipliers: number[] = factors[index]!;
      for (let row: number = index + 1; row < size; ++row)
        column[row]! -= multipliers[row - index - 1]! * column[index]!;
    }

    return backSubstitute(matrix, column);
  };
}

/*
 * Solve one square system without allocating retained factors or a solver
 * closure. The same finite/scaled premises and strict pivot refusal apply.
 *
 * The actual RHS is copied as one augmented column and participates in each
 * original row update before descending substitution. Pivot ties, rejection,
 * update and subtraction order match repeated preparation's common numerical
 * owner. O(N^3) work and one O(N^2) matrix retain no factor rows, pivots,
 * closure or prior solution. Augmented rows release on return/refusal; only
 * the fresh O(N) solution escapes.
 */
export function solve(
  rows: readonly (readonly number[])[],
  right: readonly number[],
): number[] | null {
  const matrix: number[][] = rows.map(
    (row: readonly number[], index: number): number[] => [
      ...row,
      right[index]!,
    ],
  );
  return eliminate(matrix, rows.length + 1, largestEntry(rows))
    ? backSubstitute(matrix)
    : null;
}
/*
 * Preserve the original source-entry scan before any pivot is considered.
 */
function largestEntry(rows: readonly (readonly number[])[]): number {
  let largest: number = 0;
  for (const row of rows)
    for (const value of row) largest = Math.max(largest, Math.abs(value));
  return largest;
}

/*
 * One partial-pivot elimination, optionally recording factors for later
 * columns.
 */
function eliminate(
  matrix: number[][],
  columns: number,
  largest: number,
  pivots?: number[],
  factors?: number[][],
): boolean {
  const size: number = matrix.length;
  for (let column: number = 0; column < size; ++column) {
    let pivot: number = column;
    for (let row: number = column + 1; row < size; ++row)
      if (Math.abs(matrix[row]![column]!) > Math.abs(matrix[pivot]![column]!))
        pivot = row;
    if (!(Math.abs(matrix[pivot]![column]!) > 1e-14 * largest)) return false;
    pivots?.push(pivot);
    [matrix[column], matrix[pivot]] = [matrix[pivot]!, matrix[column]!];
    const multipliers: number[] | undefined =
      factors === undefined ? undefined : [];
    for (let row: number = column + 1; row < size; ++row) {
      const factor: number = matrix[row]![column]! / matrix[column]![column]!;
      multipliers?.push(factor);
      for (let entry: number = column; entry < columns; ++entry)
        matrix[row]![entry]! -= factor * matrix[column]![entry]!;
    }
    if (multipliers !== undefined) factors!.push(multipliers);
  }
  return true;
}

/*
 * Descending substitution from either an augmented column or a replayed one.
 */
function backSubstitute(
  matrix: readonly (readonly number[])[],
  right?: readonly number[],
): number[] {
  const size: number = matrix.length;
  const solution: number[] = new Array<number>(size).fill(0);
  for (let row: number = size - 1; row >= 0; --row) {
    let sum: number = right === undefined ? matrix[row]![size]! : right[row]!;
    for (let entry: number = row + 1; entry < size; ++entry)
      sum -= matrix[row]![entry]! * solution[entry]!;
    solution[row] = sum / matrix[row]![row]!;
  }
  return solution;
}

}
