import { solveResolvedRate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Square instantaneous differential kinematics with physical row units.
 *
 * Scenarios:
 * 1. An upper-triangular three-coordinate equality has rate (3,-2,1).
 *    Its infinity condition is 93/20, from the hand-written inverse rows
 *    (1/2,-1/8,3/20), (0,1/4,-1/10), (0,0,1/5).
 * 2. A metre task row and radian task row give rate (3,-2) rad/s.
 *    Converting them to millimetres/milliradians while converting their
 *    physical row scales preserves that rate and condition 4. The scaled
 *    first column forces a row swap on this successful solve.
 * 3. For 3*qdot=1, binary64 qdot is 1/3. Its true stored-value residual
 *    is -2^-54, inverse defect 2^-54 and both backward errors 2^-55.
 *    These nonzero expectations detect fabricated zero diagnostics.
 * 4. Rank deficiency, malformed dimensions, nonfinite data and invalid
 *    row scales refuse; scaling loss and arithmetic overflow remain
 *    distinguishable from unsupported input and singular pivots.
 * 5. Inputs stay unchanged and editing returned arrays cannot affect a
 *    later solve of the same physical equality.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the task and coordinate units, literal triangular/mixed-unit solutions, hand-derived condition values, binary64 third residual, refusal categories and fresh output ownership. Ordinary rate/condition comparisons use finite-aware nclose with 1e-12 for these small systems; exact powers-of-two diagnostics use zero absolute tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual public solveResolvedRate and checks rates, original/scaled residuals, conditioning and backward-error diagnostics. Unit conversion catches scaling only J or only the RHS; the stored third catches silently replaced diagnostics. Refusal statuses distinguish unsupported input, exact singularity and lost representable arithmetic, without accepting fabricated rates.
 * @evidence contracts/development/testing.md#independent-expectations Literal RHSs follow direct substitution of the stated rates. Triangular inverse row sums give norm 31/40 times matrix norm 6. The scaled mixed matrix rows (1/2,1),(3,-1) have inverse rows (2/7,2/7),(6/7,-1/7), giving infinity norms 4 and 1. The binary64 third is 6004799503160661 times 2^-54, so three times it minus one is exactly -2^-54 and its magnitude denominator rounds to two. No other solver, product LU or sampled output supplies an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses one three-coordinate triangular system, one two-coordinate mixed-unit system and its equivalent unit conversion, plus one scalar roundoff case. Refusals cover empty/rectangular/mismatched input, matrix/RHS nonfinites, positive-scale boundaries, singularity, scaling underflow/overflow and solve/diagnostic overflow. Physical Jacobian provenance, active-set validity and motion fallback belong to their actual producer tests.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable CPU unit entry uses explicit in-memory matrices and the public numerical leaf, with shared finite-aware scalar assertions. It launches no program, process, compiler, viewer or external service.
 */
export function test_kinematics_resolved_rate(): void {
  const matrix: number[][] = [[2, 1, -1], [0, 4, 2], [0, 0, 5]];
  const right: number[] = [3, -6, 5];
  const scale: number[] = [1, 1, 1];
  const triangular: solveResolvedRate.ISolved = expectRates("triangular", solveResolvedRate(matrix, right, scale), [3, -2, 1]);
  TestValidator.predicate("triangular hand-derived condition", nclose(triangular.conditionEstimate, 93 / 20, 1e-12));
  expectZeros("triangular original residual", triangular.residual);
  expectZeros("triangular scaled residual", triangular.scaledResidual);

  const mixed: solveResolvedRate.ISolved = expectRates("metres and radians",
    solveResolvedRate([[1, 2], [3, -1]], [-1, 11], [2, 1]), [3, -2]);
  const converted: solveResolvedRate.ISolved = expectRates("millimetres and milliradians",
    solveResolvedRate([[1000, 2000], [3000, -1000]], [-1000, 11000], [2000, 1000]), [3, -2]);
  for (const result of [mixed, converted]) {
    TestValidator.predicate("physical row scaling preserves condition", nclose(result.conditionEstimate, 4, 1e-12));
    expectZeros("mixed original residual", result.residual);
    expectZeros("mixed scaled residual", result.scaledResidual);
    TestValidator.predicate("finite small backward errors",
      nclose(result.componentwiseBackwardError, 0, 1e-12) && nclose(result.normwiseBackwardError, 0, 1e-12));
  }

  const third: solveResolvedRate.ISolved = expectRates("stored binary64 third", solveResolvedRate([[3]], [1], [1]), [1 / 3]);
  TestValidator.predicate("third retains actual original residual", nclose(third.residual[0]!, -(2 ** -54), 0));
  TestValidator.predicate("third retains actual scaled residual", nclose(third.scaledResidual[0]!, -(2 ** -54), 0));
  TestValidator.predicate("third inverse defect is not fabricated zero", nclose(third.inverseDefect, 2 ** -54, 0));
  TestValidator.predicate("third componentwise backward error", nclose(third.componentwiseBackwardError, 2 ** -55, 0));
  TestValidator.predicate("third normwise backward error", nclose(third.normwiseBackwardError, 2 ** -55, 0));

  TestValidator.equals("dependent rows refuse without a unique rate", solveResolvedRate([[1, 2], [2, 4]], [3, 6], [1, 1]).status, "singular");
  TestValidator.equals("zero task cannot manufacture a zero rate", solveResolvedRate([[0]], [0], [1]).status, "singular");
  TestValidator.equals("empty relation is unsupported", solveResolvedRate([], [], []).status, "unsupported");
  TestValidator.equals("rectangular relation is unsupported", solveResolvedRate([[1, 0, 0], [0, 1, 0]], [1, 1], [1, 1]).status, "unsupported");
  TestValidator.equals("RHS dimension mismatch", solveResolvedRate([[1]], [], [1]).status, "unsupported");
  TestValidator.equals("scale dimension mismatch", solveResolvedRate([[1]], [1], []).status, "unsupported");
  TestValidator.equals("nonfinite Jacobian", solveResolvedRate([[Number.NaN]], [1], [1]).status, "unsupported");
  TestValidator.equals("nonfinite goal rate", solveResolvedRate([[1]], [Number.POSITIVE_INFINITY], [1]).status, "unsupported");
  const invalidScales: readonly number[] = [0, -1, Number.NaN, Number.POSITIVE_INFINITY];
  for (const invalid of invalidScales)
    TestValidator.equals(`invalid physical scale ${invalid}`, solveResolvedRate([[1]], [1], [invalid]).status, "unsupported");

  TestValidator.equals("row scaling overflow refuses", solveResolvedRate([[1]], [1], [Number.MIN_VALUE]).status, "unrepresentable");
  TestValidator.equals("lost nonzero Jacobian entry refuses", solveResolvedRate([[Number.MIN_VALUE]], [1], [2]).status, "unrepresentable");
  TestValidator.equals("lost nonzero goal derivative refuses", solveResolvedRate([[1]], [Number.MIN_VALUE], [2]).status, "unrepresentable");
  TestValidator.equals("rate overflow refuses", solveResolvedRate([[0.5]], [Number.MAX_VALUE], [1]).status, "unrepresentable");
  TestValidator.equals("finite rate with overflowing diagnostics refuses", solveResolvedRate([[1]], [Number.MAX_VALUE], [1]).status, "unrepresentable");

  triangular.velocity[0] = 99;
  triangular.residual[0] = 99;
  triangular.scaledResidual[0] = 99;
  const fresh: solveResolvedRate.ISolved = expectRates("fresh result", solveResolvedRate(matrix, right, scale), [3, -2, 1]);
  expectZeros("fresh original residual", fresh.residual);
  expectZeros("fresh scaled residual", fresh.scaledResidual);
  TestValidator.predicate("input rows RHS and scales are unchanged",
    matrix.length === 3 && matrix.every((row: number[], index: number): boolean =>
      row.length === 3 && row.every((value: number, column: number): boolean =>
        nclose(value, [[2, 1, -1], [0, 4, 2], [0, 0, 5]][index]![column]!, 0))) &&
    right.every((value: number, index: number): boolean => nclose(value, [3, -6, 5][index]!, 0)) &&
    scale.every((value: number): boolean => nclose(value, 1, 0)));
}

/** Require an actual solved outcome and compare rates to the hand-derived vector. */
function expectRates(label: string, result: solveResolvedRate.IResult, expected: readonly number[]): solveResolvedRate.ISolved {
  if (result.status !== "solved") throw new Error(`${label}: expected solved, got ${result.status}`);
  TestValidator.equals(`${label}: coordinate count`, result.velocity.length, expected.length);
  TestValidator.equals(`${label}: original residual count`, result.residual.length, expected.length);
  TestValidator.equals(`${label}: scaled residual count`, result.scaledResidual.length, expected.length);
  for (let index: number = 0; index < expected.length; ++index)
    TestValidator.predicate(`${label}: coordinate ${index}`, nclose(result.velocity[index]!, expected[index]!, 1e-12));
  return result;
}

/** A zero residual uses the row's own finite units, without borrowing another solver. */
function expectZeros(label: string, values: readonly number[]): void {
  for (let index: number = 0; index < values.length; ++index)
    TestValidator.predicate(`${label}: row ${index}`, nclose(values[index]!, 0, 1e-12));
}
