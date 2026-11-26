import type {
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticProgram,
} from "@automovie/interface";

import { AUTOMOVIE_QUADRATIC_INFINITY } from "../../constants/AUTOMOVIE_QUADRATIC_INFINITY";

/**
 * Check explicit diagonal-program admission rules without building its sparse
 * matrix.
 *
 * The bounded displacement and underwear-surface working-set callers admit the
 * whole program before restricting it; assembly and original-coordinate
 * refinement share this admission. Inactive malformed rows cannot evade the
 * check. This does not solve the program or prove its feasibility, convergence,
 * conditioning or post-transform geometry.
 *
 * The program needs one through 2^31-1 variables, at most 2^31-1 rows, complete
 * diagonal/linear/optional initial vectors, a nonnegative diagonal and equally
 * sized row weights/indices. Indices must be unique in-range integers and
 * nullable inclusive bounds must be ordered. Each supplied coefficient or
 * nonnull endpoint is finite with magnitude strictly below the numerical 1e30
 * infinity sentinel; exact zero coefficients remain unchanged.
 *
 * Array containers and row shape are typed caller premises. Indexed reads
 * refuse resident holes, and explicit rule failures throw before matrix
 * assembly without changing inputs. Int32 dimensions do not prove aggregate
 * CSC-entry, factor-fill or TypeScript workspace capacity: the duplicate marker
 * or later numerical storage can still fail to allocate, and host allocation or
 * malformed-container errors need not have a named rule message.
 *
 * @param input Program to check; it is only read.
 */
export function admitAutoMovieQuadraticProgram(
  input: [IAutoMovieSolveQuadraticProgram.IInput][0],
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
      if (id < 0 || id >= variables || lastRow[id] === i)
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

/**
 * Return the original finite scalar only when its magnitude is strictly below
 * the numerical infinity sentinel.
 */
function admitScalar(value: number): number {
  if (Math.abs(value) >= AUTOMOVIE_QUADRATIC_INFINITY)
    throw new Error(
      "Quadratic coefficients must be finite and smaller than 1e30.",
    );
  return value;
}
