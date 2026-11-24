import { overflowsBinary64 } from "./overflowsBinary64";

/**
 * The assignment of rows to distinct columns of least total cost: the Hungarian
 * method (Kuhn 1955) in its shortest-augmenting-path form, for a rectangular
 * cost table with no more rows than columns.
 *
 * Row `i` is given column `result[i]`; no two rows share a column, and the sum
 * of `cost[i][result[i]]` is the least any such assignment reaches. Ties are
 * broken by the scan order of rows and columns, so the same table always gives
 * the same assignment.
 *
 * @param cost The cost of giving each row each column: `rows` arrays of
 *   `columns` finite numbers, `rows <= columns`.
 * @returns The column of each row.
 * @throws {Error} When the table is ragged, has more rows than columns, or
 *   holds a value that is not finite: a caller's defect. Also when finite costs
 *   are so far apart that the potentials' reduced costs overflow binary64
 *   (differences beyond the largest double), which the shortest-path search
 *   cannot order.
 */
export function assignAutoMovieMinimumCost(
  cost: readonly (readonly number[])[],
): number[] {
  const n: number = cost.length;
  if (n === 0) return [];
  const m: number = cost[0]!.length;
  if (n > m)
    throw new Error(
      `assignAutoMovieMinimumCost: ${n} rows cannot take distinct columns of ${m}`,
    );
  cost.forEach((row: readonly number[], i: number): void => {
    if (row.length !== m)
      throw new Error(
        `assignAutoMovieMinimumCost: row ${i} has ${row.length} columns, ${m} expected`,
      );
  });

  // Potentials u (rows) and v (columns), 1-based with column 0 the virtual start; way[j] is the column before j on the path.
  const u: number[] = new Array<number>(n + 1).fill(0);
  const v: number[] = new Array<number>(m + 1).fill(0);
  const owner: number[] = new Array<number>(m + 1).fill(0);
  const way: number[] = new Array<number>(m + 1).fill(0);
  for (let i: number = 1; i <= n; ++i) {
    owner[0] = i;
    let j0: number = 0;
    const least: number[] = new Array<number>(m + 1).fill(Infinity);
    const used: boolean[] = new Array<boolean>(m + 1).fill(false);

    // Grow the shortest-path tree in reduced costs until a free column is reached.
    do {
      used[j0] = true;
      const i0: number = owner[j0]!;
      let delta: number = Infinity;
      let j1: number = 0;
      for (let j: number = 1; j <= m; ++j) {
        if (used[j]) continue;
        const reduced: number = cost[i0 - 1]![j - 1]! - u[i0]! - v[j]!;
        if (reduced < least[j]!) {
          least[j] = reduced;
          way[j] = j0;
        }
        if (least[j]! < delta) {
          delta = least[j]!;
          j1 = j;
        }
      }

      // At most i <= rows <= columns columns are used here, so an unused one
      // always exists, and finite reduced costs give it a finite delta. A
      // delta that is not finite means the potentials overflowed binary64;
      // its column 0 would be re-entered forever, so the table is refused.
      if (overflowsBinary64(delta))
        throw new Error(
          "assignAutoMovieMinimumCost: the reduced costs overflow binary64",
        );
      for (let j: number = 0; j <= m; ++j)
        if (used[j]) {
          u[owner[j]!] = u[owner[j]!]! + delta;
          v[j] = v[j]! - delta;
        } else least[j] = least[j]! - delta;
      j0 = j1;
    } while (owner[j0] !== 0);

    // Flip the matching along the path back to the start.
    do {
      const j1: number = way[j0]!;
      owner[j0] = owner[j1]!;
      j0 = j1;
    } while (j0 !== 0);
  }
  const result: number[] = new Array<number>(n).fill(-1);
  for (let j: number = 1; j <= m; ++j)
    if (owner[j] !== 0) result[owner[j]! - 1] = j - 1;
  return result;
}
