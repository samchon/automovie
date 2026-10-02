import { updateHumanBodySimpleJacobian } from "@automovie/human/body/simple/updateHumanBodySimpleJacobian";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The secant expression must cancel and divide before binary64 range loss
 * when its final coefficient is representable. Expected coefficients follow
 * the zero-row equation B_new*s=y or the scalar identity B_new=y/s.
 *
 * Scenarios:
 * 1. Ten minimum-subnormal steps share y=+/-1e-15: y/(10*s) is finite
 *    although y/s alone overflows. Inputs and each result column remain owned.
 * 2. A dot product below the minimum subnormal still cancels the old scalar
 *    coefficient exactly when y=0; no rounded zero may erase that dependency.
 * 3. Subnormal scalar answers round below/above half and ties to even, keeping
 *    the sign of an underflow zero. Exact zero remains zero.
 * 4. A truly unrepresentable positive/negative scalar answer still overflows.
 * 5. Minimum-subnormal directions project an odd/even normal significand at
 *    a halfway boundary, so normal rounding also uses the even neighbour.
 * 6. A normal old-dot can entirely swallow a small nonzero residual change;
 *    scalar cancellation must recover y/s from the original finite inputs.
 */
export const test_human_body_simple_jacobian_binary_range = (): void => {
  const size = 10;
  const columns = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  const step = new Array<number>(size).fill(Number.MIN_VALUE);
  for (const sign of [-1, 1]) {
    const delta = [sign * 1e-15, ...new Array<number>(size - 1).fill(0)];
    const expected = (delta[0] / size) / Number.MIN_VALUE;
    const snapshot = JSON.stringify({ columns, step, delta });
    const result = updateHumanBodySimpleJacobian(columns, step, delta);
    TestValidator.predicate("finite shared tiny-step coefficient",
      result.every((column) => Number.isFinite(column[0]) &&
        nclose(column[0] / expected, 1, 1e-12) && column.slice(1).every((value) => value === 0)));
    TestValidator.equals("original matrix and vectors remain unchanged",
      JSON.stringify({ columns, step, delta }), snapshot);
    TestValidator.predicate("matrix and columns are fresh",
      result !== columns && result.every((column, index) => column !== columns[index]));
    TestValidator.equals("underflowing old-dot cancellation",
      updateHumanBodySimpleJacobian([[sign * 1e-200]], [1e-150], [0]), [[0]]);
    for (const divisor of [1, 1e-15]) {
      const actual = updateHumanBodySimpleJacobian([[sign * Number.MAX_VALUE]],
        [divisor], [sign * Number.MIN_VALUE])[0][0];
      TestValidator.predicate("nonzero residual survives large old-dot subtraction",
        Object.is(actual, sign * Number.MIN_VALUE / divisor));
    }
    for (const [numerator, divisor, expectedUnits] of [
      [1, 3, 0], [2, 3, 1], [1, 2, 0], [3, 2, 2], [5, 2, 2],
    ]) {
      const actual = updateHumanBodySimpleJacobian([[0]], [divisor],
        [sign * numerator * Number.MIN_VALUE])[0][0];
      const expected = sign * expectedUnits * Number.MIN_VALUE;
      TestValidator.predicate("nearest subnormal with signed-zero ties", Object.is(actual, expected));
    }
    TestValidator.predicate("genuine scalar overflow",
      updateHumanBodySimpleJacobian([[0]], [Number.MIN_VALUE], [sign])[0][0] === sign * Infinity);
  }
  for (const units of [1, 3]) {
    const epsilon = 2 ** -52;
    // Project [2, -units*epsilon] orthogonally to (s,s). Its entries are
    // +/-(1+units*epsilon/2), exactly halfway between adjacent normal values.
    const result = updateHumanBodySimpleJacobian([[2, 0], [-units * epsilon, 0]],
      [Number.MIN_VALUE, Number.MIN_VALUE], [0, 0]);
    const expected = units === 1 ? 1 : 1 + 2 * epsilon;
    TestValidator.predicate("normal projection rounds a tie to even",
      Object.is(result[0][0], expected) && Object.is(result[1][0], -expected) &&
      result[0][1] === 0 && result[1][1] === 0);
  }
};
