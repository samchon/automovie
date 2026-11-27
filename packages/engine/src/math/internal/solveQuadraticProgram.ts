import type {
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticKernel,
  IAutoMovieSolveQuadraticProgram,
} from "@automovie/interface";

import { addQuadraticProduct } from "./addQuadraticProduct";
import { assembleQuadraticProgram } from "./assembleQuadraticProgram";
import { solveQuadraticKernel } from "./solveQuadraticKernel";

/*
 * Solve a nonempty positive-semidefinite diagonal quadratic program. Finite
 * coefficients and endpoints must have magnitude below 1e30, the numerical
 * infinity sentinel; larger finite values cannot be represented as such by this
 * backend. Diagonal entries are nonnegative, not necessarily positive. Sparse
 * arrays, duplicate indices and reversed bounds are refused.
 *
 * Status 1 is the full solved status. Other statuses and all residuals are
 * retained, including infeasibility and incomplete iteration. A caller must
 * choose an acceptance tolerance in its own units and check the original
 * geometry after subsequent transformations. This function does not turn a
 * solver status or objective decrease into a geometric validity certificate.
 */
export function solveQuadraticProgram(
  input: IAutoMovieSolveQuadraticProgram.IInput,
): IAutoMovieSolveQuadraticProgram.IResult {
  const result: IAutoMovieSolveQuadraticKernel.IResult =
    solveQuadraticKernel(assembleQuadraticProgram(input));
  let maximumViolation: number = 0;
  const gradient: Float64Array = new Float64Array(2 * input.linear.length);
  for (let at: number = 0; at < input.linear.length; at++) {
    gradient[2 * at] = input.linear[at]!;
    addQuadraticProduct(
      gradient,
      at,
      input.diagonal[at]!,
      result.primal[at]!,
    );
  }
  const value: Float64Array = new Float64Array(2);
  const violations: Float64Array = new Float64Array(4);
  for (let i: number = 0; i < input.rows.length; i++) {
    const row: IAutoMovieQuadraticRow = input.rows[i]!;
    value.fill(0);
    for (let j: number = 0; j < row.indices.length; j++) {
      const id: number = row.indices[j]!;
      addQuadraticProduct(
        value,
        0,
        row.weights[j]!,
        result.primal[id]!,
      );
      addQuadraticProduct(
        gradient,
        id,
        row.weights[j]!,
        result.dual[i]!,
      );
    }
    violations.fill(0);
    if (row.lower !== null) {
      violations[0] = row.lower;
      addQuadraticProduct(violations, 0, -value[0]!, 1);
      addQuadraticProduct(violations, 0, -value[1]!, 1);
    }
    if (row.upper !== null) {
      violations[2] = -row.upper;
      addQuadraticProduct(violations, 1, value[0]!, 1);
      addQuadraticProduct(violations, 1, value[1]!, 1);
    }
    maximumViolation = Math.max(
      maximumViolation,
      violations[0]! + violations[1]!,
      violations[2]! + violations[3]!,
    );
  }
  let stationarityResidual: number = 0;
  for (let at: number = 0; at < input.linear.length; at++)
    stationarityResidual = Math.max(
      stationarityResidual,
      Math.abs(gradient[2 * at]! + gradient[2 * at + 1]!),
    );
  return { ...result, maximumViolation, stationarityResidual };
}
