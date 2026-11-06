import { AUTOMOVIE_QUADRATIC_INFINITY } from "../constants/AUTOMOVIE_QUADRATIC_INFINITY";
import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";
import type { solveAutoMovieQuadraticKernel } from "./solveAutoMovieQuadraticKernel";

/**
 * Expand admitted interval CSC into the engine's zero/nonnegative standard form.
 * Equalities precede finite upper/lower sides; a lower side negates A and b.
 * Original-row signed dual reconstruction uses the returned mapping. Caller
 * arrays are copied before subsequent numerical scaling; initial is ignored.
 *
 * @evidence contracts/common.md#principled-implementation Ax<=u becomes Ax+s=u and Ax>=l becomes -Ax+s=-l with s>=0; equality slack is zero. These are equivalent constraints with signed original multipliers, including exact-zero and tiny coefficients.
 * @evidence contracts/common.md#clear-and-simple-design Conic representation and row mapping have one producer; admission remains at the public adapter and equilibration at its numerical owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No row, coefficient or objective term is removed; only documented infinity sentinels omit unbounded sides and initial remains a compatibility-only input.
 * @evidence contracts/common.md#meaningful-documentation States conic signs, equality ordering, copied inputs and mapping ownership.
 * @evidence contracts/performance.md#efficient-algorithms Expanded rows and entries are at most twice the originals. Assembly uses O(n+m+nnz) storage and O(nnz plus per-column entry sorting) work to retain sorted CSC rows.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each mutable assembled input receives a fresh owned representation and no previous problem is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary side maps are bounded by original rows; returned arrays transfer to one solve, with no global retention or external handle.
 */
export function createAutoMovieQuadraticConicProgram(
  input: Parameters<typeof solveAutoMovieQuadraticKernel>[0],
): IAutoMovieQuadraticConicProgram {
  const n: number = input.diagonal.length;
  const count: number = input.lower.length;
  const mapping: { original: number; sign: number; bound: number }[] = [];
  const sides: number[][] = Array.from({ length: count }, (): number[] => []);
  for (let row: number = 0; row < count; row++)
    if (input.lower[row] === input.upper[row])
      mapping.push({ original: row, sign: 1, bound: input.lower[row]! });
  const equalities: number = mapping.length;
  for (let row: number = 0; row < count; row++) {
    if (input.lower[row] === input.upper[row]) continue;
    if (input.upper[row]! < AUTOMOVIE_QUADRATIC_INFINITY)
      mapping.push({ original: row, sign: 1, bound: input.upper[row]! });
    if (input.lower[row]! > -AUTOMOVIE_QUADRATIC_INFINITY)
      mapping.push({ original: row, sign: -1, bound: -input.lower[row]! });
  }
  for (let row: number = 0; row < mapping.length; row++)
    sides[mapping[row]!.original]!.push(row);
  const columns: Int32Array = new Int32Array(n + 1);
  const rows: number[] = [];
  const values: number[] = [];
  for (let column: number = 0; column < n; column++) {
    const entries: { row: number; value: number }[] = [];
    for (let at: number = input.columns[column]!; at < input.columns[column + 1]!; at++)
      for (const row of sides[input.rowIndices[at]!]!)
        entries.push({ row, value: mapping[row]!.sign * input.values[at]! });
    entries.sort((a: { row: number }, b: { row: number }): number => a.row - b.row);
    for (const entry of entries) {
      rows.push(entry.row);
      values.push(entry.value);
    }
    if (rows.length > 0x7fffffff)
      throw new Error("Expanded quadratic matrix exceeds int32 storage.");
    columns[column + 1] = rows.length;
  }
  const b: Float64Array = Float64Array.from(mapping, (entry: { bound: number }): number => entry.bound);
  return {
    n, m: mapping.length, equalities,
    p: Float64Array.from(input.diagonal), q: Float64Array.from(input.linear), b,
    columns, rows: Int32Array.from(rows), values: Float64Array.from(values),
    originalRows: Int32Array.from(mapping, (entry: { original: number }): number => entry.original),
    signs: Float64Array.from(mapping, (entry: { sign: number }): number => entry.sign),
    d: new Float64Array(n).fill(1), e: new Float64Array(mapping.length).fill(1), c: 1,
    normq: input.linear.reduce((norm: number, value: number): number => Math.max(norm, Math.abs(value)), 0),
    normb: b.reduce((norm: number, value: number): number => Math.max(norm, Math.abs(value)), 0),
  };
}
