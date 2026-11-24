import { addAutoMovieQuadraticProduct } from "../math/addAutoMovieQuadraticProduct";
import { prepareLinearSystem } from "../math/prepareLinearSystem";

/**
 * Solve the current square differential kinematics J(q) qdot = goalRate. Rows
 * and the matching goal rate use the same task frame and physical unit; each
 * column uses its actual coordinate unit, so output is that unit/second.
 * Positive rowScale divides both sides of each row, for example the current
 * chain length for metre rows and one for radian rows. It changes neither the
 * equality nor the coordinate rates and never weights a residual fit. Keep all
 * supplied numeric rows and vectors unchanged until return.
 *
 * The caller owns an actual analytic Jacobian and goal derivative on one smooth
 * branch. Uncontrolled ancestor/root motion must be included in that Jacobian
 * or subtracted from the goal rate in the same task frame. This numerical leaf
 * neither samples a pose nor proves that a supplied matrix is its derivative.
 * Active constraints, changing active sets, rectangular systems and unsupported
 * charts need the caller's explicit derivative fallback; no clamped or damped
 * answer is manufactured here.
 *
 * The existing LU owner's pivot refusal is retained, not interpreted as a
 * nonsingularity certificate. A solved result reports actual original-unit
 * residuals, scaled backward errors, an inverse-based infinity condition
 * estimate and the computed inverse defect. These are numerical diagnostics,
 * not certified forward-error bounds or a physical acceptance tolerance.
 *
 * @param jacobian Current finite nonempty square task-row/coordinate-column
 *   matrix.
 * @param goalRate Current finite task derivative, in the same row units/second.
 * @param rowScale Positive finite physical scale for each task row, unchanged
 *   during the call.
 * @returns Fresh rates/diagnostics, or an explicit unsupported, pivot-refused
 *   or unrepresentable result.
 */
export function solveResolvedRate(
  jacobian: readonly (readonly number[])[],
  goalRate: readonly number[],
  rowScale: readonly number[],
): solveResolvedRate.IResult {
  const size: number = jacobian.length;
  if (
    size === 0 ||
    goalRate.length !== size ||
    rowScale.length !== size
  )
    return { status: "unsupported" };
  for (let row: number = 0; row < size; ++row)
    if (jacobian[row]!.length !== size || rowScale[row]! <= 0)
      return { status: "unsupported" };

  const scaled: number[][] = jacobian.map(
    (row: readonly number[], index: number): number[] =>
      row.map((value: number): number => value / rowScale[index]!),
  );
  const right: number[] = goalRate.map(
    (value: number, row: number): number => value / rowScale[row]!,
  );
  for (let row: number = 0; row < size; ++row) {
    if (goalRate[row] !== 0 && right[row] === 0)
      return { status: "unrepresentable" };
    for (let column: number = 0; column < size; ++column)
      if (jacobian[row]![column] !== 0 && scaled[row]![column] === 0)
        return { status: "unrepresentable" };
  }
  const solve: ReturnType<typeof prepareLinearSystem> =
    prepareLinearSystem(scaled);
  if (solve === null) return { status: "singular" };
  const velocity: number[] = solve(right);
  const inverse: number[][] = [];
  const identity: number[] = new Array<number>(size).fill(0);
  const inverseRows: number[] = new Array<number>(size).fill(0);
  for (let column: number = 0; column < size; ++column) {
    identity[column] = 1;
    const values: number[] = solve(identity);
    identity[column] = 0;
    inverse.push(values);
    for (let row: number = 0; row < size; ++row)
      inverseRows[row]! += Math.abs(values[row]!);
  }
  const scratch: Float64Array = new Float64Array(4);
  let matrixNorm: number = 0;
  for (const row of scaled)
    matrixNorm = Math.max(
      matrixNorm,
      row.reduce(
        (sum: number, value: number): number => sum + Math.abs(value),
        0,
      ),
    );
  const inverseNorm: number = Math.max(...inverseRows);
  const conditionEstimate: number = matrixNorm * inverseNorm;
  let inverseDefect: number = 0;
  for (let row: number = 0; row < size; ++row) {
    let sum: number = 0;
    for (let column: number = 0; column < size; ++column) {
      dot(
        scratch,
        scaled[row]!,
        inverse[column]!,
        row === column ? -1 : 0,
        false,
      );
      sum += Math.abs(scratch[0]! + scratch[1]!);
    }
    inverseDefect = Math.max(inverseDefect, sum);
  }

  const residual: number[] = [];
  const scaledResidual: number[] = [];
  let componentwiseBackwardError: number = 0;
  let residualNorm: number = 0;
  const velocityNorm: number = Math.max(
    ...velocity.map((value: number): number => Math.abs(value)),
  );
  const rightNorm: number = Math.max(
    ...right.map((value: number): number => Math.abs(value)),
  );
  for (let row: number = 0; row < size; ++row) {
    dot(scratch, jacobian[row]!, velocity, -goalRate[row]!);
    const error: number = scratch[0]! + scratch[1]!;
    const magnitude: number = scratch[2]! + scratch[3]!;

    residual.push(error);
    componentwiseBackwardError = Math.max(
      componentwiseBackwardError,
      magnitude === 0
        ? error === 0
          ? 0
          : Infinity
        : Math.abs(error) / magnitude,
    );
    dot(scratch, scaled[row]!, velocity, -right[row]!, false);
    const scaledError: number = scratch[0]! + scratch[1]!;
    scaledResidual.push(scaledError);
    residualNorm = Math.max(residualNorm, Math.abs(scaledError));
  }
  const denominator: number = matrixNorm * velocityNorm + rightNorm;
  const normwiseBackwardError: number =
    denominator === 0
      ? residualNorm === 0
        ? 0
        : Infinity
      : residualNorm / denominator;
  // A nonzero error against a zero magnitude has no relative size.
  if (
    componentwiseBackwardError === Infinity ||
    normwiseBackwardError === Infinity
  )
    return { status: "unrepresentable" };
  return {
    status: "solved",
    velocity,
    residual,
    scaledResidual,
    conditionEstimate,
    inverseDefect,
    componentwiseBackwardError,
    normwiseBackwardError,
  };
}

/**
 * Accumulate a signed dot; only original residuals also demand the absolute
 * denominator.
 */
function dot(
  scratch: Float64Array,
  row: readonly number[],
  values: readonly number[],
  constant: number,
  magnitude: boolean = true,
): void {
  scratch.fill(0);
  scratch[0] = constant;
  if (magnitude) scratch[2] = Math.abs(constant);
  for (let column: number = 0; column < row.length; ++column) {
    addAutoMovieQuadraticProduct(scratch, 0, row[column]!, values[column]!);
    if (magnitude)
      addAutoMovieQuadraticProduct(
        scratch,
        1,
        Math.abs(row[column]!),
        Math.abs(values[column]!),
      );
  }
}

/** Numerical differential-equality outcomes without curve-admission flags. */
export namespace solveResolvedRate {
  /**
   * Actual solved relation and diagnostics, or the precise numerical refusal
   * category.
   */
  export type IResult =
    | ISolved
    | {
        /**
         * Unsupported means invalid/non-square inputs; singular is the existing LU
         * pivot gate; unrepresentable means arithmetic or diagnostics lost
         * finite/nonzero data.
         */
        status: "unsupported" | "singular" | "unrepresentable";
      };

  /**
   * All arrays are fresh; no returned diagnostic is a certified physical error
   * bound.
   */
  export interface ISolved {
    /**
     * Actual completed square numerical solve, subject to the measured
     * diagnostics.
     */
    status: "solved";
    /** Coordinate units/second, in the supplied Jacobian's column order. */
    velocity: number[];
    /** J*velocity-goalRate, in each original task row's units/second. */
    residual: number[];
    /** (J/rowScale)*velocity-goalRate/rowScale, in scaled row units/second. */
    scaledResidual: number[];
    /** ||A||inf times the computed inverse's infinity norm, A=J/rowScale; an estimate, not a certified upper bound. */
    conditionEstimate: number;
    /**
     * Computed ||A*computedInverse-I||inf, without a rigorous rounding
     * enclosure.
     */
    inverseDefect: number;
    /**
     * Max_i abs(originalResidual_i)/(abs(J)*abs(velocity)+abs(goalRate))_i;
     * exact 0/0 is represented by zero.
     */
    componentwiseBackwardError: number;
    /** ||scaledResidual||inf/(||A||inf\*||velocity||inf+||goalRate/rowScale||inf); exact 0/0 is zero. */
    normwiseBackwardError: number;
  }
}
