import { AUTOMOVIE_QUADRATIC_INFINITY } from "../constants/AUTOMOVIE_QUADRATIC_INFINITY";
import { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import { admitAutoMovieQuadraticProgram } from "./admitAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticKernel } from "./solveAutoMovieQuadraticKernel";
import { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

/**
 * Admits a sparse-row quadratic program and lays its constraint matrix out in
 * the compressed sparse column form the native kernel reads.
 *
 * Admission is `admitAutoMovieQuadraticProgram`, so an inadmissible program
 * throws before anything is built. Column `c` holds its nonzeros at
 * `columns[c]` up to `columns[c + 1]`, in ascending row order, and a weight of
 * exactly zero is kept as an explicit entry. A null row endpoint becomes
 * `-AUTOMOVIE_QUADRATIC_INFINITY` or `AUTOMOVIE_QUADRATIC_INFINITY`, the
 * kernel's unbounded sentinel.
 *
 * @param input Program in sparse-row form; it is only read.
 * @returns Kernel input whose `columns`, `rowIndices`, `values`, `lower` and
 *   `upper` are new arrays, while `diagonal`, `linear` and `initial` are the
 *   caller's own arrays, so mutating them later changes the assembled program.
 *
 * @evidence contracts/common.md#principled-implementation The textbook two-pass transpose of a row-wise sparse matrix into compressed columns: count each column's entries, prefix-sum the counts into column pointers, then scatter rows in ascending order through a per-column cursor, which leaves every column sorted by row as the CSC format the Clarabel bridge passes to `CscMatrix` requires; admission first guarantees in-range unique indices, so the cursors never collide or leave a gap.
 * @evidence contracts/common.md#clear-and-simple-design Admission lives in `admitAutoMovieQuadraticProgram` because the displacement solvers, refinement and the garment fit must check a whole program they never assemble, and this function only adds the layout, which `solveAutoMovieQuadraticProgram` alone needs before calling the kernel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every row is laid out the same way and no coefficient is dropped, rescaled or merged, including exact zeros; the only substitution is a null endpoint becoming the kernel's documented unbounded sentinel.
 * @evidence contracts/common.md#meaningful-documentation States that admission runs first and throws, the column pointer layout and row order, that exact zeros stay, the sentinel for null endpoints, and which returned arrays are new and which are the caller's own.
 * @evidence contracts/performance.md#efficient-algorithms Linear in variables `n`, rows `m` and nonzeros `nnz`: two passes over the row entries plus one over the column counts, with column pointers and cursors of `n + 1` and `n` numbers, entry arrays of exactly `nnz` and endpoint arrays of `m`, and no per-entry or per-column temporary list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call lays out the program it is given; the only caller solves it once and nothing is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns its arrays to the caller and keeps no reference; the cursor array is released when the call returns.
 */
export function assembleAutoMovieQuadraticProgram(
  input: Parameters<typeof solveAutoMovieQuadraticProgram>[0],
): Parameters<typeof solveAutoMovieQuadraticKernel>[0] {
  admitAutoMovieQuadraticProgram(input);
  const variables: number = input.diagonal.length;
  const count: number = input.rows.length;
  const columns: number[] = new Array<number>(variables + 1).fill(0);
  for (const row of input.rows) for (const id of row.indices) columns[id + 1]++;
  for (let column: number = 0; column < variables; column++)
    columns[column + 1] += columns[column];
  const nonzeros: number = columns[variables]!;
  const cursor: number[] = columns.slice(0, variables);
  const rowIndices: number[] = new Array<number>(nonzeros);
  const values: number[] = new Array<number>(nonzeros);
  const lower: number[] = new Array<number>(count);
  const upper: number[] = new Array<number>(count);
  for (let i: number = 0; i < count; i++) {
    const row: IAutoMovieQuadraticRow = input.rows[i]!;
    for (let j: number = 0; j < row.indices.length; j++) {
      const at: number = cursor[row.indices[j]]++;
      rowIndices[at] = i;
      values[at] = row.weights[j]!;
    }
    lower[i] = row.lower ?? -AUTOMOVIE_QUADRATIC_INFINITY;
    upper[i] = row.upper ?? AUTOMOVIE_QUADRATIC_INFINITY;
  }
  return {
    diagonal: input.diagonal,
    linear: input.linear,
    columns,
    rowIndices,
    values,
    lower,
    upper,
    initial: input.initial,
  };
}
