import { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import { assembleAutoMovieQuadraticProgram } from "./assembleAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticKernel } from "./solveAutoMovieQuadraticKernel";

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
