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
 * @evidence contracts/common.md#principled-implementation Solves the admitted diagonal PSD objective through CSC assembly and the pinned native kernel, then independently evaluates original row bounds and stationarity H*x+q+A-transpose*y with the returned signed row duals; these residuals retain the caller's coefficient units and do not replace post-transform geometry checks.
 * @evidence contracts/common.md#clear-and-simple-design The adapter joins admission, native solving and two original-problem residuals without changing solver statuses or choosing a caller-specific acceptance tolerance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Infeasible and incomplete statuses remain observable and no regularization, bound relaxation or objective rescaling is introduced to obtain a solved result.
 * @evidence contracts/common.md#meaningful-documentation States PSD and sentinel limits, sparse admission, solved-status interpretation, residual ownership and the need to measure geometry after later transformations.
 * @evidence contracts/performance.md#efficient-algorithms CSC assembly and residual reconstruction each cost O(n+m+nnz), with one n-entry gradient array after the native solve; every original row must be visited to detect maximum bound violation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Solves the current mutable input once and reconstructs its original residuals once; no cached status or gradient is shared across problems.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Assembled arrays and gradient are local and released on return; the result owns copied native primal and dual arrays, while reactor retention belongs to solveAutoMovieQuadraticKernel.
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
  const result: ReturnType<typeof solveAutoMovieQuadraticKernel> = solveAutoMovieQuadraticKernel(
    assembleAutoMovieQuadraticProgram(input),
  );
  let maximumViolation: number = 0;
  const gradient: number[] = input.linear.map(
    (value: number, i: number): number => value + input.diagonal[i]! * result.primal[i]!,
  );
  for (let i: number = 0; i < input.rows.length; i++) {
    const row: IAutoMovieQuadraticRow = input.rows[i]!;
    let value: number = 0;
    for (let j: number = 0; j < row.indices.length; j++) {
      const id: number = row.indices[j]!;
      value += row.weights[j] * result.primal[id];
      gradient[id] += row.weights[j] * result.dual[i];
    }
    maximumViolation = Math.max(
      maximumViolation,
      row.lower === null ? 0 : row.lower - value,
      row.upper === null ? 0 : value - row.upper,
    );
  }
  let stationarityResidual: number = 0;
  for (const value of gradient)
    stationarityResidual = Math.max(stationarityResidual, Math.abs(value));
  return { ...result, maximumViolation, stationarityResidual };
}
