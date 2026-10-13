import { AUTOMOVIE_QUADRATIC_INFINITY } from "../constants/AUTOMOVIE_QUADRATIC_INFINITY";
import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import type { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

/**
 * Throws unless a diagonal quadratic program is one the native kernel can
 * represent, without building its sparse matrix.
 *
 * A caller that later solves only a selected subset of rows admits the whole
 * original program here first, so a currently inactive malformed row cannot
 * evade the check; `assembleAutoMovieQuadraticProgram` runs the same check
 * before it builds the matrix. The program needs between one and `2^31 - 1`
 * variables, at most `2^31 - 1` rows, dense diagonal, linear and optional
 * initial vectors of the variable count, a nonnegative diagonal, and in every
 * row as many weights as indices, unique integer indices inside the variable
 * range, and ordered endpoints. Every coefficient and endpoint must be finite
 * with magnitude below `AUTOMOVIE_QUADRATIC_INFINITY` (`1e30`), the kernel's
 * unbounded sentinel. Each refusal names the failed rule in its message.
 *
 * @param input Program to check; it is only read.
 */
export function admitAutoMovieQuadraticProgram(
  input: Parameters<typeof solveAutoMovieQuadraticProgram>[0],
): void {
  const variables: number = input.diagonal.length;
  if (
    variables === 0 ||
    variables > 0x7fffffff ||
    input.rows.length > 0x7fffffff
  )
    throw new Error(
      "Quadratic program needs positive int32 variable dimensions.",
    );
  admitVector(input.diagonal, variables);
  admitVector(input.linear, variables);
  if (input.initial !== undefined) admitVector(input.initial, variables);
  for (let at: number = 0; at < variables; at++)
    if (input.diagonal[at]! < 0)
      throw new Error("Quadratic diagonal must be nonnegative.");
  // The last row that used each variable, so a repeated index inside one row
  // is found without a per-row set.
  const lastRow: Int32Array = new Int32Array(variables).fill(-1);
  for (let i: number = 0; i < input.rows.length; i++) {
    const row: IAutoMovieQuadraticRow | undefined = input.rows[i];
    if (row === undefined) throw new Error("Quadratic rows must be complete.");
    admitVector(row.weights, row.indices.length);
    for (let j: number = 0; j < row.indices.length; j++) {
      const id: number = row.indices[j]!;
      if (
        !Number.isInteger(id) ||
        id < 0 ||
        id >= variables ||
        lastRow[id] === i
      )
        throw new Error("Quadratic row needs unique in-range integer indices.");
      lastRow[id] = i;
    }
    const lower: number =
      row.lower === null ? -Infinity : admitScalar(row.lower);
    const upper: number =
      row.upper === null ? Infinity : admitScalar(row.upper);
    if (lower > upper)
      throw new Error("Quadratic interval bounds must be ordered.");
  }
}

/** Reads every slot by index, so a hole is refused rather than skipped. */
function admitVector(values: readonly number[], length: number): void {
  if (values.length !== length)
    throw new Error("Quadratic vector dimensions must agree.");
  for (let at: number = 0; at < values.length; at++) admitScalar(values[at]!);
}

function admitScalar(value: number): number {
  if (
    !Number.isFinite(value) ||
    Math.abs(value) >= AUTOMOVIE_QUADRATIC_INFINITY
  )
    throw new Error(
      "Quadratic coefficients must be finite and smaller than 1e30.",
    );
  return value;
}
