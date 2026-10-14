import { AUTOMOVIE_QUADRATIC_INFINITY } from "../constants/AUTOMOVIE_QUADRATIC_INFINITY";
import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import type { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

/**
 * Check explicit diagonal-program admission rules without building its sparse matrix.
 *
 * The bounded displacement and underwear-surface working-set callers admit the whole program before restricting it; assembly and original-coordinate refinement share this admission. Inactive malformed rows cannot evade the check. This does not solve the program or prove its feasibility, convergence, conditioning or post-transform geometry.
 *
 * The program needs one through 2^31-1 variables, at most 2^31-1 rows, complete diagonal/linear/optional initial vectors, a nonnegative diagonal and equally sized row weights/indices. Indices must be unique in-range integers and nullable inclusive bounds must be ordered. Each supplied coefficient or nonnull endpoint is finite with magnitude strictly below the native 1e30 infinity sentinel; exact zero coefficients remain unchanged.
 *
 * Array containers and row shape are typed caller premises. Indexed reads refuse resident holes, and explicit rule failures throw before matrix assembly without changing inputs. Int32 dimensions do not prove aggregate CSC-entry or wasm32 transport capacity: the duplicate marker or later assembled workspace can still fail to allocate, and host allocation or malformed-container errors need not have a named rule message.
 *
 * @param input Program to check; it is only read.
 *
 * @evidence contracts/common.md#principled-implementation Indexed vector/row admission establishes dense finite coefficients below the native sentinel, PSD diagonal terms, complete rows, unique in-range variable indices and ordered nullable intervals. One signed-int32 last-row marker per variable detects duplicates without sorting or changing zero coefficients.
 * @evidence contracts/common.md#clear-and-simple-design This admission owner is shared by CSC assembly, bounded displacement, original-coordinate refinement and the underwear-surface restricted solve. It checks the original full population while those consumers own selection, solving and acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No row is skipped, normalized, merged or repaired; resident vector/index/row holes fail actual indexed reads. Typed array/row shape and allocatable marker storage remain premises; aggregate CSC/wasm capacity is unchecked here, and admission does not imply numerical solve or geometric success.
 * @evidence contracts/common.md#meaningful-documentation States int32 dimensions, vector/row completeness, nonnegative diagonal, index uniqueness, null-bound meaning, strict 1e30 limits, unchanged input and explicit-rule versus host allocation failure.
 * @evidence contracts/performance.md#efficient-algorithms N variables, M rows and Z listed entries require O(N+M+Z) work, including marker initialization and dense vector scans. The Int32Array adds four N bytes plus its host object, avoids per-row sets and is allocated even when the row population is empty.
 * @evidence contracts/performance.md#reuse-equivalent-work The same marker buffer serves every row by storing its latest row ordinal; vectors and scalar bounds share private admission predicates. Changed mutable programs are reread and no verdict or buffer is cached between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain borrowed and unmodified; the call-local marker becomes unreachable on return or throw and is reclaimed by the host rather than explicitly disposed. Explicit refusal creates one Error/host stack without attaching the input, and no matrix, native kernel workspace or task is acquired.
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

/** Return the original finite scalar only when its magnitude is strictly below the native infinity sentinel. */
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
