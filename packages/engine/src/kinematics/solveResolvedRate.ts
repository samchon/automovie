import { addAutoMovieQuadraticProduct } from "../math/addAutoMovieQuadraticProduct";
import { prepareLinearSystem } from "../math/prepareLinearSystem";

/**
 * Solve the current square differential kinematics J(q) qdot = goalRate.
 * Rows and the matching goal rate use the same task frame and physical unit;
 * each column uses its actual coordinate unit, so output is that unit/second.
 * Positive rowScale divides both sides of each row, for example the current
 * chain length for metre rows and one for radian rows. It changes neither
 * the equality nor the coordinate rates and never weights a residual fit.
 * Keep all supplied numeric rows and vectors unchanged until return.
 *
 * The caller owns an actual analytic Jacobian and goal derivative on one
 * smooth branch. Uncontrolled ancestor/root motion must be included in that
 * Jacobian or subtracted from the goal rate in the same task frame.
 * This numerical leaf neither samples a pose nor proves that
 * a supplied matrix is its derivative. Active constraints, changing active
 * sets, rectangular systems and unsupported charts need the caller's explicit
 * derivative fallback; no clamped or damped answer is manufactured here.
 *
 * The existing LU owner's pivot refusal is retained, not interpreted as a
 * nonsingularity certificate. A solved result reports actual original-unit
 * residuals, scaled backward errors, an inverse-based infinity condition
 * estimate and the computed inverse defect. These are numerical diagnostics,
 * not certified forward-error bounds or a physical acceptance tolerance.
 *
 * @param jacobian Current finite nonempty square task-row/coordinate-column matrix.
 * @param goalRate Current finite task derivative, in the same row units/second.
 * @param rowScale Positive finite physical scale for each task row, unchanged during the call.
 * @returns Fresh rates/diagnostics, or an explicit unsupported, pivot-refused or unrepresentable result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines differential equality, task frame and units, physical row scaling, square smooth-branch support, explicit fallback ownership and the limits of every returned diagnostic.
 * @evidence contracts/development/implementation.md#principled-implementation The chain rule gives goalRate=J(q)qdot (Lynch and Park, Modern Robotics chapter 5, https://modernrobotics.northwestern.edu/nu-gm-book-resource/velocity-kinematics-and-statics/). Positive diagonal row scaling preserves this square equality. Existing partial-pivot LU solves it without normal equations or damping. Replaying unit right sides estimates ||A||inf||A^-1||inf as in LAPACK DGECON (https://netlib.org/lapack/explore-html/d4/daf/group__gecon_ga4f9b830e19e12c7f082ddb497a57af18.html); actual residuals give normwise and componentwise backward errors as in LAPACK LA_LIN_BERR (https://www.netlib.org/lapack/explore-html/db/d65/group__la__lin__berr_ga56eebc95b5d984d77c0dc2e444e98e6a.html). These measured diagnostics do not certify an analytic input or exact rank.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This leaf admits dimensions/scales, delegates all elimination to prepareLinearSystem, reuses its factor for rates and inverse columns, then measures original and scaled equations through the shared twofold product owner. The motion producer retains Jacobian construction and branch/physical admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite-difference derivative, normal matrix, regularization, clipped rate, discarded task, body/fixture branch or new pivot threshold is introduced. Nonzero values lost by scaling and nonfinite diagnostics refuse. An LU result alone is never reported as a valid physical curve derivative.
 * @evidence contracts/development/implementation.md#efficient-algorithms For N coordinates, one O(N^3) factor, N+1 O(N^2) solves and O(N^3) measured inverse-defect work use O(N^2) local storage. The actual initial consumer supplies six clinical coordinates; no query history or pose/FK evaluation is required. Runtime gains are unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same privately copied scaled matrix factor serves the actual RHS and all inverse columns. Each completed inverse entry serves its norm and defect, and one twofold scratch serves all current residual dots without retaining caller rows or rates after return.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns O(N^2) scaled rows, factor storage and inverse columns plus O(N) vectors and four scratch cells. Only fresh rates/residuals and scalar diagnostics escape; refusal or throw releases all call-local state with no cache, process or handle.
 */
export function solveResolvedRate(
  jacobian: readonly (readonly number[])[],
  goalRate: readonly number[],
  rowScale: readonly number[],
): solveResolvedRate.IResult {
  const size: number = jacobian.length;
  if (size === 0 || goalRate.length !== size || rowScale.length !== size ||
    !Number.isSafeInteger(size * size)) return { status: "unsupported" };
  for (let row: number = 0; row < size; ++row) {
    if (jacobian[row]?.length !== size ||
      !Number.isFinite(goalRate[row]) || !Number.isFinite(rowScale[row]) ||
      !(rowScale[row]! > 0)) return { status: "unsupported" };
    for (let column: number = 0; column < size; ++column)
      if (!Number.isFinite(jacobian[row]![column])) return { status: "unsupported" };
  }

  const scaled: number[][] = jacobian.map(
    (row: readonly number[], index: number): number[] => row.map(
      (value: number): number => value / rowScale[index]!,
    ),
  );
  const right: number[] = goalRate.map(
    (value: number, row: number): number => value / rowScale[row]!,
  );
  for (let row: number = 0; row < size; ++row) {
    if (!Number.isFinite(right[row]) || (goalRate[row] !== 0 && right[row] === 0))
      return { status: "unrepresentable" };
    for (let column: number = 0; column < size; ++column)
      if (!Number.isFinite(scaled[row]![column]) ||
        (jacobian[row]![column] !== 0 && scaled[row]![column] === 0))
        return { status: "unrepresentable" };
  }
  const solve: ReturnType<typeof prepareLinearSystem> = prepareLinearSystem(scaled);
  if (solve === null) return { status: "singular" };
  const velocity: number[] = solve(right);
  if (!velocity.every(Number.isFinite)) return { status: "unrepresentable" };
  const inverse: number[][] = [];
  const identity: number[] = new Array<number>(size).fill(0);
  const inverseRows: number[] = new Array<number>(size).fill(0);
  for (let column: number = 0; column < size; ++column) {
    identity[column] = 1;
    const values: number[] = solve(identity);
    identity[column] = 0;
    if (!values.every(Number.isFinite)) return { status: "unrepresentable" };
    inverse.push(values);
    for (let row: number = 0; row < size; ++row)
      inverseRows[row]! += Math.abs(values[row]!);
  }
  const scratch: Float64Array = new Float64Array(4);
  let matrixNorm: number = 0;
  for (const row of scaled)
    matrixNorm = Math.max(matrixNorm,
      row.reduce((sum: number, value: number): number => sum + Math.abs(value), 0));
  const inverseNorm: number = Math.max(...inverseRows);
  const conditionEstimate: number = matrixNorm * inverseNorm;
  let inverseDefect: number = 0;
  for (let row: number = 0; row < size; ++row) {
    let sum: number = 0;
    for (let column: number = 0; column < size; ++column) {
      dot(scratch, scaled[row]!, inverse[column]!, row === column ? -1 : 0);
      sum += Math.abs(scratch[0]! + scratch[1]!);
    }
    inverseDefect = Math.max(inverseDefect, sum);
  }

  const residual: number[] = [];
  const scaledResidual: number[] = [];
  let componentwiseBackwardError: number = 0;
  let residualNorm: number = 0;
  const velocityNorm: number = Math.max(...velocity.map((value: number): number => Math.abs(value)));
  const rightNorm: number = Math.max(...right.map((value: number): number => Math.abs(value)));
  for (let row: number = 0; row < size; ++row) {
    dot(scratch, jacobian[row]!, velocity, -goalRate[row]!);
    const error: number = scratch[0]! + scratch[1]!;
    const magnitude: number = scratch[2]! + scratch[3]!;
    if (!Number.isFinite(error) || !Number.isFinite(magnitude))
      return { status: "unrepresentable" };
    residual.push(error);
    componentwiseBackwardError = Math.max(componentwiseBackwardError,
      magnitude === 0 ? error === 0 ? 0 : Infinity : Math.abs(error) / magnitude);
    dot(scratch, scaled[row]!, velocity, -right[row]!);
    const scaledError: number = scratch[0]! + scratch[1]!;
    scaledResidual.push(scaledError);
    residualNorm = Math.max(residualNorm, Math.abs(scaledError));
  }
  const denominator: number = matrixNorm * velocityNorm + rightNorm;
  const normwiseBackwardError: number = denominator === 0
    ? residualNorm === 0 ? 0 : Infinity : residualNorm / denominator;
  if (![conditionEstimate, inverseDefect, componentwiseBackwardError,
    normwiseBackwardError, denominator, ...scaledResidual].every(Number.isFinite))
    return { status: "unrepresentable" };
  return { status: "solved", velocity, residual, scaledResidual,
    conditionEstimate, inverseDefect, componentwiseBackwardError, normwiseBackwardError };
}

/** Accumulate one current residual and its absolute denominator in twofold pairs. */
function dot(scratch: Float64Array, row: readonly number[],
  values: readonly number[], constant: number): void {
  scratch.fill(0);
  scratch[0] = constant;
  scratch[2] = Math.abs(constant);
  for (let column: number = 0; column < row.length; ++column) {
    addAutoMovieQuadraticProduct(scratch, 0, row[column]!, values[column]!);
    addAutoMovieQuadraticProduct(scratch, 1, Math.abs(row[column]!), Math.abs(values[column]!));
  }
}

/**
 * Numerical differential-equality outcomes without curve-admission flags.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines status-specific fallback meanings, original versus scaled residual units and the measured condition/backward-error/defect diagnostics.
 * @evidence contracts/development/design.md#principled-representation A solved square equality carries its actual rate and numerical diagnostics; unsupported dimensions/inputs, pivot refusal and unrepresentable work remain distinguishable rather than represented by fabricated zero rates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The analytic clinical-curve producer consumes the coordinate rates and numerical diagnostics while retaining its own branch, ROM, goal and physical-budget admission. No pose, skeleton, cache, damping policy or caller success flag is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A solved status proves neither exact rank, analytic provenance, active-set legality nor derivative accuracy of the physical curve. Unsupported or insufficiently qualified results require the consumer's existing correct fallback.
 */
export namespace solveResolvedRate {
  /** Actual solved relation and diagnostics, or the precise numerical refusal category. */
  export type IResult = ISolved | {
    /** unsupported means invalid/non-square inputs; singular is the existing LU pivot gate; unrepresentable means arithmetic or diagnostics lost finite/nonzero data. */
    status: "unsupported" | "singular" | "unrepresentable";
  };

  /** All arrays are fresh; no returned diagnostic is a certified physical error bound. */
  export interface ISolved {
    /** Actual completed square numerical solve, subject to the measured diagnostics. */
    status: "solved";
    /** Coordinate units/second, in the supplied Jacobian's column order. */
    velocity: number[];
    /** J*velocity-goalRate, in each original task row's units/second. */
    residual: number[];
    /** (J/rowScale)*velocity-goalRate/rowScale, in scaled row units/second. */
    scaledResidual: number[];
    /** ||A||inf times the computed inverse's infinity norm, A=J/rowScale; an estimate, not a certified upper bound. */
    conditionEstimate: number;
    /** Computed ||A*computedInverse-I||inf, without a rigorous rounding enclosure. */
    inverseDefect: number;
    /** max_i abs(originalResidual_i)/(abs(J)*abs(velocity)+abs(goalRate))_i; exact 0/0 is represented by zero. */
    componentwiseBackwardError: number;
    /** ||scaledResidual||inf/(||A||inf*||velocity||inf+||goalRate/rowScale||inf); exact 0/0 is zero. */
    normwiseBackwardError: number;
  }
}
