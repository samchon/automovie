/**
 * Diagonal convex programs for shared geometric displacement. Callers supply
 * min 1/2 x' diag(P) x + q' x, with sparse lower <= A x <= upper rows in their
 * declared units. This owner validates the numerical domain, assembles CSC,
 * and independently measures returned constraint and stationarity residuals.
 * The pinned kernel owns numerical iteration, not geometry or acceptance.
 * No caller buffer is mutated and no warm-start state survives a call.
 */
import { solveAutoMovieQuadraticKernel } from "./quadraticKernel";

/**
 * One sparse affine interval. Indices are unique variable ordinals; weights
 * have the same length. A null endpoint is unbounded. Empty rows are constant
 * zero constraints, which may make the problem infeasible.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Expresses a shared linear displacement condition without attaching it to a particular asset or subject.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains original variable identities, coefficients and both interval bounds for independent residual evaluation.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRow {
  /** Unique zero-based variable indices. */
  indices: readonly number[];
  /** Finite coefficients corresponding to indices, including exact zeros. */
  weights: readonly number[];
  /** Inclusive finite lower endpoint, or null for no lower bound. */
  lower: number | null;
  /** Inclusive finite upper endpoint, or null for no upper bound. */
  upper: number | null;
}

/**
 * Solve a nonempty positive-semidefinite diagonal quadratic program. Finite
 * coefficients and endpoints must have magnitude below 1e30, the native
 * infinity sentinel; larger finite values cannot be represented as such by
 * this backend. Diagonal entries are nonnegative, not necessarily positive.
 * Sparse arrays, duplicate indices and reversed bounds are refused.
 *
 * Status 1 is the native solved status. Other statuses and all residuals are
 * retained, including infeasibility and incomplete iteration. A caller must
 * choose an acceptance tolerance in its own units and check the original
 * geometry after subsequent transformations. This function does not turn a
 * solver status or objective decrease into a geometric validity certificate.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Minimizes coupled geometric travel while retaining every declared affine interval and returning failure rather than a relaxed substitute.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Converts validated rows to owned column-compressed buffers and measures constraint and stationarity residuals against the original coefficients.
 */
export function solveAutoMovieQuadraticProgram(input: {
  diagonal: readonly number[];
  linear: readonly number[];
  rows: readonly IAutoMovieQuadraticRow[];
  initial?: readonly number[];
}): ReturnType<typeof solveAutoMovieQuadraticKernel> & {
  maximumViolation: number;
  stationarityResidual: number;
} {
  const result = solveAutoMovieQuadraticKernel(
    assembleAutoMovieQuadraticProgram(input),
  );
  let maximumViolation = 0;
  const gradient = input.linear.map(
    (value, i) => value + input.diagonal[i] * result.primal[i],
  );
  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    let value = 0;
    for (let j = 0; j < row.indices.length; j++) {
      const id = row.indices[j];
      value += row.weights[j] * result.primal[id];
      gradient[id] += row.weights[j] * result.dual[i];
    }
    maximumViolation = Math.max(
      maximumViolation,
      row.lower === null ? 0 : row.lower - value,
      row.upper === null ? 0 : value - row.upper,
    );
  }
  let stationarityResidual = 0;
  for (const value of gradient)
    stationarityResidual = Math.max(stationarityResidual, Math.abs(value));
  return { ...result, maximumViolation, stationarityResidual };
}

/**
 * Admit every original coefficient before a caller selects restricted rows.
 * Constraint generation uses this same owner so a currently inactive malformed
 * row cannot evade validation. The returned CSC arrays are independent copies;
 * diagonal, linear and optional initial vectors remain borrowed read-only data.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits the complete coupled displacement problem before numerical scheduling can restrict its active rows.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Owns finite-domain validation and sparse column construction for all constrained geometry callers.
 */
export function assembleAutoMovieQuadraticProgram(
  input: Parameters<typeof solveAutoMovieQuadraticProgram>[0],
): Parameters<typeof solveAutoMovieQuadraticKernel>[0] {
  const n = input.diagonal.length;
  if (n === 0 || n > 0x7fffffff || input.rows.length > 0x7fffffff)
    throw new Error(
      "Quadratic program needs positive int32 variable dimensions.",
    );
  finiteVector(input.diagonal, n);
  finiteVector(input.linear, n);
  if (input.initial !== undefined) finiteVector(input.initial, n);
  if (input.diagonal.some((value) => value < 0))
    throw new Error("Quadratic diagonal must be nonnegative.");
  const columns = Array.from({ length: n }, () => [] as [number, number][]);
  const lower: number[] = [],
    upper: number[] = [];
  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    if (row === undefined) throw new Error("Quadratic rows must be complete.");
    finiteVector(row.weights, row.indices.length);
    const seen = new Set<number>();
    for (let j = 0; j < row.indices.length; j++) {
      const id = row.indices[j];
      if (!Number.isInteger(id) || id < 0 || id >= n || seen.has(id))
        throw new Error("Quadratic row needs unique in-range integer indices.");
      seen.add(id);
      columns[id].push([i, row.weights[j]]);
    }
    const lo = row.lower === null ? -1e30 : finiteScalar(row.lower);
    const hi = row.upper === null ? 1e30 : finiteScalar(row.upper);
    if (lo > hi) throw new Error("Quadratic interval bounds must be ordered.");
    lower.push(lo);
    upper.push(hi);
  }
  const pointers = [0],
    rowIndices: number[] = [],
    values: number[] = [];
  for (const column of columns) {
    for (const [row, value] of column) {
      rowIndices.push(row);
      values.push(value);
    }
    pointers.push(values.length);
  }
  return {
    diagonal: input.diagonal,
    linear: input.linear,
    columns: pointers,
    rowIndices,
    values,
    lower,
    upper,
    initial: input.initial,
  };
}

/** Indexed reads reject holes rather than letting Array.every skip them. */
function finiteVector(values: readonly number[], length: number): void {
  if (values.length !== length)
    throw new Error("Quadratic vector dimensions must agree.");
  for (let i = 0; i < values.length; i++) finiteScalar(values[i]);
}

function finiteScalar(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) >= 1e30)
    throw new Error(
      "Quadratic coefficients must be finite and smaller than 1e30.",
    );
  return value;
}
