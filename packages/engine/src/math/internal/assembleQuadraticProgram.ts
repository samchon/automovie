import type {
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticProgram,
} from "@automovie/interface";

import { AutoMovieEngineQuadraticInfinity } from "../../constants/AutoMovieEngineQuadraticInfinity";
import { admitQuadraticProgram } from "./admitQuadraticProgram";

/*
 * Admits a sparse-row quadratic program and lays its constraint matrix out in
 * the compressed sparse column form the engine numerical kernel reads.
 *
 * Admission is `admitQuadraticProgram`, so an inadmissible program
 * throws before anything is built. Column `c` holds its nonzeros at
 * `columns[c]` up to `columns[c + 1]`, in ascending row order, and a weight of
 * exactly zero is kept as an explicit entry. A null row endpoint becomes
 * `-AutoMovieEngineQuadraticInfinity` or `AutoMovieEngineQuadraticInfinity`, the
 * kernel's unbounded sentinel.
 * Parameter input: Program in sparse-row form; it is only read.
 * Returns: Kernel input whose `columns`, `rowIndices`, `values`, `lower` and
 * `upper` are new arrays, while `diagonal`, `linear` and `initial` are the
 * caller's own arrays, so mutating them later changes the assembled program.
 */
export function assembleQuadraticProgram(
  input: [IAutoMovieSolveQuadraticProgram.IInput][0],
): [
  {
    diagonal: readonly number[];
    linear: readonly number[];
    columns: readonly number[];
    rowIndices: readonly number[];
    values: readonly number[];
    lower: readonly number[];
    upper: readonly number[];
    initial?: readonly number[];
  },
][0] {
  admitQuadraticProgram(input);
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
    lower[i] = row.lower ?? -AutoMovieEngineQuadraticInfinity;
    upper[i] = row.upper ?? AutoMovieEngineQuadraticInfinity;
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
