import { solveAutoMovieQuadraticKernel } from "./quadraticKernel";
import { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

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
