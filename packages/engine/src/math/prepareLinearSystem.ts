/**
 * Factor an unchanged square matrix for repeated right-hand sides using
 * partial-pivot Gaussian elimination. Inputs must be finite, square and
 * consistently scaled with representable intermediate arithmetic. A pivot
 * no greater than 1e-14 times the largest original entry returns null, the
 * existing dense solver's rejection rule rather than a rank certificate.
 *
 * The returned solver replays the same row swaps and elimination factors on
 * each copied right-hand side, then performs back substitution in descending
 * row order. Its arithmetic for every right-hand side is the augmented
 * Gaussian solve's original arithmetic, including strict pivot ties and
 * subtraction order. The source matrix may change after preparation because
 * the factor owns its copied coefficients; prepare again to adopt changes.
 *
 * @param rows Matrix entries by rows, not modified.
 * @returns A solver returning fresh solution arrays, or null at the pivot gate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States square/finite/scaled premises, matrix snapshot ownership, strict pivot rejection, right-hand-side copying and fresh results.
 * @evidence contracts/development/implementation.md#principled-implementation Partial-pivot Gaussian elimination separates matrix-only pivots/factors from each augmented column; replaying their swaps and subtractions before the original back substitution solves the same system in the same arithmetic order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation owns matrix elimination and one returned closure owns right-hand-side elimination/back substitution, serving both ordinary dense solves and repeated digit null-space columns.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original largest-entry pivot threshold and first-row-on-tie pivot policy remain; there is no regularization, inverse approximation or alternate rank decision.
 * @evidence contracts/development/implementation.md#efficient-algorithms Setup costs O(N^3) time and O(N^2) coefficients/factors; each right-hand side costs O(N^2) time and O(N) fresh storage, avoiding repeated matrix elimination for an unchanged matrix.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pivots and factors depend only on the privately copied matrix, so all right-hand sides reuse exactly completed matrix work without caching solutions or depending on source-array identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure owns O(N^2) copied triangular coefficients/factors and O(N) pivots until caller release. Each solve releases its O(N) working column after returning its solution; rejected setup retains nothing and no global state or handles exist.
 */
export function prepareLinearSystem(
  rows: readonly (readonly number[])[],
): ((right: readonly number[]) => number[]) | null {
  const size: number = rows.length;
  const matrix: number[][] = rows.map(
    (row: readonly number[]): number[] => [...row],
  );
  const pivots: number[] = [];
  const factors: number[][] = [];
  if (!eliminate(matrix, size, largestEntry(rows), pivots, factors)) return null;

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

/**
 * One-shot augmented solving and repeated right-hand sides share elimination.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the ordinary dense consumer and its factor-free augmented path.
 * @evidence contracts/development/design.md#principled-representation A one-shot right-hand side is one extra eliminated column; repeated right-hand sides instead retain matrix-only swaps/factors.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSolidVector.solve consumes the one-shot entry and fitDigitDescent consumes prepared factors; both use one pivot/elimination/back-substitution owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second pivot policy, regularization, inverse or target cache is introduced by choosing storage for the actual number of right-hand sides.
 */
export namespace prepareLinearSystem {
  /**
   * Solve one square system without allocating retained factors or a solver
   * closure. The same finite/scaled premises and strict pivot refusal apply.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines one-shot augmented storage, unchanged premises/refusal and fresh output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Partial-pivot elimination includes the augmented right-hand-side column in the original row update, then the same descending back substitution reads it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One-shot and prepared paths share eliminate, largestEntry and backSubstitute; only repeated solving records swaps/multipliers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The matrix/RHS copy, strict pivot selection/refusal, row-update order and back-subtraction order are the ordinary solve's exact formulas.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N^3) work and one O(N^2) augmented matrix avoid factor rows, pivot arrays and a retained closure on ordinary one-shot workloads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both storage strategies share the same actual mathematical owner; a one-shot request retains no factor or prior solution.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Augmented rows release on return or refusal; only one fresh O(N) solution escapes, with no global state or handles.
   */
  export function solve(
    rows: readonly (readonly number[])[],
    right: readonly number[],
  ): number[] | null {
    const matrix: number[][] = rows.map(
      (row: readonly number[], index: number): number[] => [...row, right[index]!],
    );
    return eliminate(matrix, rows.length + 1, largestEntry(rows))
      ? backSubstitute(matrix) : null;
  }
}

/** Preserve the original source-entry scan before any pivot is considered. */
function largestEntry(rows: readonly (readonly number[])[]): number {
  let largest: number = 0;
  for (const row of rows)
    for (const value of row) largest = Math.max(largest, Math.abs(value));
  return largest;
}

/** One partial-pivot elimination, optionally recording factors for later columns. */
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
    const multipliers: number[] | undefined = factors === undefined ? undefined : [];
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

/** Descending substitution from either an augmented column or a replayed one. */
function backSubstitute(matrix: readonly (readonly number[])[], right?: readonly number[]): number[] {
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
