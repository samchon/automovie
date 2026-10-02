import { updateHumanBodySimpleJacobian } from "@automovie/human/body/simple/updateHumanBodySimpleJacobian";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

const matrixClose = (actual: number[][] | null, expected: number[][]): boolean =>
  actual !== null && actual.length === expected.length && actual.every(
    (column, index) => column.length === expected[index].length && column.every(
      (value, row) => nclose(value, expected[index][row]),
    ),
  );

/**
 * Broyden's rank-one update uses the unchanged complete matrix and satisfies
 * the accepted step's secant equation, including off-diagonal entries.
 *
 * Scenarios:
 * 1. Identity B, s=(1,1), y=(3,5) gives columns (2,2),(1,3), independently
 *    from (y-Bs)s^T/(s^Ts). Inputs remain unchanged.
 * 2. Three coupled columns and s=(1,2,-1) give the hand-derived matrix below;
 *    multiplying the updated matrix by s gives y=(2,1,4).
 * 3. A zero step refuses; a nonzero step whose old prediction already
 *    equals y preserves every matrix value, in newly owned columns.
 */
export const test_human_body_simple_jacobian = (): void => {
  const columns = [[1, 0], [0, 1]];
  const step = [1, 1];
  const delta = [3, 5];
  TestValidator.predicate("two-dimensional outer product", matrixClose(updateHumanBodySimpleJacobian(
    columns, step, delta,
  ), [[2, 2], [1, 3]]));
  TestValidator.equals("matrix is unchanged", columns, [[1, 0], [0, 1]]);
  TestValidator.equals("step is unchanged", step, [1, 1]);
  TestValidator.equals("delta is unchanged", delta, [3, 5]);
  const three = updateHumanBodySimpleJacobian(
    [[1, 2, 0], [0, 1, 1], [2, 0, 1]], [1, 2, -1], [2, 1, 4],
  );
  TestValidator.predicate("three-dimensional outer product", matrixClose(three,
    [[1.5, 1.5, 0.5], [1, 0, 2], [1.5, 0.5, 0.5]]));
  TestValidator.predicate("secant equation", three !== null && [2, 1, 4].every(
    (value, row) => nclose(three.reduce(
      (sum, column, index) => sum + column[row] * [1, 2, -1][index], 0,
    ), value),
  ));
  TestValidator.predicate("no secant direction", throwsError(
    () => updateHumanBodySimpleJacobian(columns, [0, 0], [3, 5]), "nonzero step",
  ));
  const unchanged = updateHumanBodySimpleJacobian(columns, step, [1, 1]);
  TestValidator.predicate("zero correction", matrixClose(unchanged, columns));
  TestValidator.predicate("fresh matrix and columns",
    unchanged !== columns && unchanged?.every((column, index) => column !== columns[index]) === true);
};
