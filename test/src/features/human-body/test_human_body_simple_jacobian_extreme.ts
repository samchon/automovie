import { updateHumanBodySimpleJacobian } from "@automovie/human/body/simple/updateHumanBodySimpleJacobian";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Rescaling s and y by the same nonzero factor leaves the secant correction
 * unchanged: identity B, s=(1,1), y=(3,5) gives columns (2,2) and (1,3).
 *
 * Scenarios:
 * 1. Ordinary inputs retain the exact already-established integer matrix.
 * 2. Factors 1e-200 and 1e200 respectively underflow and overflow s^T*s,
 *    yet the independent matrix remains finite and satisfies the scaled secant.
 * 3. A finite norm can still lose an extreme positive/negative product;
 *    relative assertions distinguish the tiny nonzero answer from zero.
 * 4. Ordinary-normal and subnormal norms share an asymmetric secant oracle.
 * 5. An actual zero vector still refuses; caller-owned arrays stay unchanged.
 * 6. Large finite old rows and residual subtraction cannot turn representable
 *    scalar/3x3 secant answers into Infinity/NaN or change an inactive column.
 */
export const test_human_body_simple_jacobian_extreme = (): void => {
  const columns = [[1, 0], [0, 1]];
  const expected = [[2, 2], [1, 3]];
  TestValidator.equals("ordinary arithmetic remains exact",
    updateHumanBodySimpleJacobian(columns, [1, 1], [3, 5]), expected);
  for (const scale of [1e-200, 1e200]) {
    const step = [scale, scale];
    const delta = [3 * scale, 5 * scale];
    const snapshot = JSON.stringify({ columns, step, delta });
    const result = updateHumanBodySimpleJacobian(columns, step, delta);
    TestValidator.predicate("scale-independent finite rank-one matrix",
      result.every((column, j) => column.every((value, i) =>
        Number.isFinite(value) && nclose(value, expected[j][i], 1e-12))));
    TestValidator.predicate("scaled secant equation",
      result.every((_column, i) => nclose(
        result.reduce((sum, column, j) => sum + column[i] * (step[j] / scale), 0),
        delta[i] / scale, 1e-12)));
    TestValidator.equals("all input arrays unchanged", JSON.stringify({ columns, step, delta }), snapshot);
    TestValidator.predicate("every result column is owned",
      result !== columns && result.every((column, j) => column !== columns[j]));
  }
  for (const sign of [-1, 1]) {
    const overflow = updateHumanBodySimpleJacobian([[1]], [2], [sign * 1e308]);
    TestValidator.predicate("finite norm keeps a representable large correction",
      Number.isFinite(overflow[0][0]) && nclose(overflow[0][0] / (sign * 5e307), 1, 1e-12));
    const underflow = updateHumanBodySimpleJacobian([[0]], [1e-100], [sign * 1e-300]);
    TestValidator.predicate("finite norm keeps a nonzero tiny correction",
      underflow[0][0] !== 0 && nclose(underflow[0][0] / (sign * 1e-200), 1, 1e-12));
  }
  for (const scale of [1e-153, 1e-161]) {
    const result = updateHumanBodySimpleJacobian(columns, [scale, 2 * scale], [3 * scale, 5 * scale]);
    const asymmetric = [[1.4, 0.6], [0.8, 2.2]];
    TestValidator.predicate("asymmetric secant across normal/subnormal norms",
      result.every((column, j) => column.every((value, i) =>
        Number.isFinite(value) && nclose(value, asymmetric[j][i], 1e-12))));
  }
  for (const sign of [-1, 1]) {
    const fixtures = [
      { columns: [[sign * 1e308]], step: [2], delta: [sign * 1e308], expected: [[sign * 5e307]] },
      { columns: [[sign * 1e308]], step: [1], delta: [-sign * 1e308], expected: [[-sign * 1e308]] },
      { columns: [[sign * 1e308, 0], [0, 1e308]], step: [2, 0], delta: [sign * 1e308, 0], expected: [[sign * 5e307, 0], [0, 1e308]] },
      { columns: [[sign * 1e308, 0, 0], [sign * 1e308, 1, 0], [-sign * 1e308, 0, 1]], step: [2, 2, 2], delta: [sign * 1e308, 0, 0], expected: [[sign * (5 / 6) * 1e308, -1 / 3, -1 / 3], [sign * (5 / 6) * 1e308, 2 / 3, -1 / 3], [-sign * (7 / 6) * 1e308, -1 / 3, 2 / 3]] },
    ];
    for (const fixture of fixtures) {
      const snapshot = JSON.stringify(fixture);
      const result = updateHumanBodySimpleJacobian(fixture.columns, fixture.step, fixture.delta);
      TestValidator.predicate("finite old-row secant oracle",
        result.every((column, j) => column.every((value, i) => {
          const expected = fixture.expected[j][i];
          return expected === 0 ? value === 0 : Number.isFinite(value) && nclose(value / expected, 1, 1e-12);
        })));
      TestValidator.equals("exceptional row inputs stay unchanged", JSON.stringify(fixture), snapshot);
      TestValidator.predicate("exceptional row outputs are owned",
        result !== fixture.columns && result.every((column, j) => column !== fixture.columns[j]));
    }
  }
  TestValidator.predicate("actual zero has no secant direction", throwsError(() =>
    updateHumanBodySimpleJacobian(columns, [0, 0], [1, 1]), "nonzero step"));
};
