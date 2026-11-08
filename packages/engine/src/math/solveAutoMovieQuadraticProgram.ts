import { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import { addAutoMovieQuadraticProduct } from "./addAutoMovieQuadraticProduct";
import { assembleAutoMovieQuadraticProgram } from "./assembleAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticKernel } from "./solveAutoMovieQuadraticKernel";

/**
 * Solve a nonempty positive-semidefinite diagonal quadratic program. Finite
 * coefficients and endpoints must have magnitude below 1e30, the numerical
 * infinity sentinel; larger finite values cannot be represented as such by
 * this backend. Diagonal entries are nonnegative, not necessarily positive.
 * Sparse arrays, duplicate indices and reversed bounds are refused.
 *
 * Status 1 is the full solved status. Other statuses and all residuals are
 * retained, including infeasibility and incomplete iteration. A caller must
 * choose an acceptance tolerance in its own units and check the original
 * geometry after subsequent transformations. This function does not turn a
 * solver status or objective decrease into a geometric validity certificate.
 *
 * @evidence contracts/common.md#principled-implementation Solves the admitted diagonal PSD objective through CSC assembly and the engine-owned TypeScript homogeneous interior-point kernel, then independently evaluates original row bounds and stationarity H*x+q+A-transpose*y with signed row duals; these residuals retain caller coefficient units and do not replace post-transform geometry checks.
 * @evidence contracts/common.md#clear-and-simple-design The adapter joins admission, numerical solving and two original-problem residuals without changing solver statuses or choosing a caller-specific acceptance tolerance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Infeasible and incomplete statuses remain observable. The authored objective and bounds are unchanged: internal Ruiz equilibration is an invertible coordinate/objective scaling whose D/E/c factors are undone for diagnostics, while KKT stabilization affects numerical factors only and refinement measures the original system.
 * @evidence contracts/common.md#meaningful-documentation States PSD and sentinel limits, sparse admission, solved-status interpretation, residual ownership and the need to measure geometry after later transformations.
 * @evidence contracts/performance.md#efficient-algorithms CSC assembly and residual reconstruction each cost O(n+m+nnz), with two doubles per gradient component and constant row scratch after the solve; every original row must be visited to detect maximum bound violation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Solves the current mutable input once and reconstructs its original residuals once; no cached status or gradient is shared across problems.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Assembled arrays and gradient are local and become unreachable on return; the result owns copied primal and dual arrays, and the engine kernel retains no reactor, factor or workspace across calls.
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
  const result: ReturnType<typeof solveAutoMovieQuadraticKernel> =
    solveAutoMovieQuadraticKernel(assembleAutoMovieQuadraticProgram(input));
  let maximumViolation: number = 0;
  const gradient: Float64Array = new Float64Array(2 * input.linear.length);
  for (let at: number = 0; at < input.linear.length; at++) {
    gradient[2 * at] = input.linear[at]!;
    addAutoMovieQuadraticProduct(gradient, at, input.diagonal[at]!, result.primal[at]!);
  }
  const value: Float64Array = new Float64Array(2);
  const violations: Float64Array = new Float64Array(4);
  for (let i: number = 0; i < input.rows.length; i++) {
    const row: IAutoMovieQuadraticRow = input.rows[i]!;
    value.fill(0);
    for (let j: number = 0; j < row.indices.length; j++) {
      const id: number = row.indices[j]!;
      addAutoMovieQuadraticProduct(value, 0, row.weights[j]!, result.primal[id]!);
      addAutoMovieQuadraticProduct(gradient, id, row.weights[j]!, result.dual[i]!);
    }
    violations.fill(0);
    if (row.lower !== null) {
      violations[0] = row.lower;
      addAutoMovieQuadraticProduct(violations, 0, -value[0]!, 1);
      addAutoMovieQuadraticProduct(violations, 0, -value[1]!, 1);
    }
    if (row.upper !== null) {
      violations[2] = -row.upper;
      addAutoMovieQuadraticProduct(violations, 1, value[0]!, 1);
      addAutoMovieQuadraticProduct(violations, 1, value[1]!, 1);
    }
    maximumViolation = Math.max(maximumViolation,
      violations[0]! + violations[1]!, violations[2]! + violations[3]!);
  }
  let stationarityResidual: number = 0;
  for (let at: number = 0; at < input.linear.length; at++)
    stationarityResidual = Math.max(stationarityResidual,
      Math.abs(gradient[2 * at]! + gradient[2 * at + 1]!));
  return { ...result, maximumViolation, stationarityResidual };
}
