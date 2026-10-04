import { humanBodyFlexionAxesCollinear } from "@automovie/human/body/basis/humanBodyFlexionAxesCollinear";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Shared-axis scalar composition requires exact source-double collinearity;
 * a determinant erased by double multiplication is not an identity.
 *
 * Scenarios:
 * 1. Positive, negative, signed-zero, subnormal and extreme finite scales
 *    preserve an identical line without rounded multiplication or overflow.
 * 2. Independent orthogonal pairs exercise each determinant refusal, and
 *    (1+u,1,0)/(1,1-u,0) has exact determinant -u squared despite rounded zero.
 * 3. Either zero direction defines no line; nonfinite directions refuse and
 *    neither accepted nor refused inputs are mutated.
 */
export const test_human_body_flexion_axis_identity = (): void => {
  const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
  for (const [a, b] of [
    [v(1, 2, 3), v(2, 4, 6)],
    [v(-1, -2, -3), v(2, 4, 6)],
    [v(1, -0, 0), v(-2, 0, -0)],
    [v(Number.MIN_VALUE, 2 * Number.MIN_VALUE, 0), v(1, 2, 0)],
    [v(Number.MAX_VALUE, Number.MAX_VALUE, 0), v(1, 1, 0)],
  ]) TestValidator.equals("exact finite scale preserves one line", humanBodyFlexionAxesCollinear(a, b), true);
  for (const [a, b] of [[v(0, 1, 0), v(0, 0, 1)], [v(1, 0, 0), v(0, 0, 1)], [v(1, 0, 0), v(0, 1, 0)]])
    TestValidator.equals("independent directions remain distinct", humanBodyFlexionAxesCollinear(a, b), false);
  const u = 2 ** -52;
  const a = v(1 + u, 1, 0), b = v(1, 1 - u, 0);
  const before = JSON.stringify([a, b]);
  TestValidator.equals("the discriminating products really round to zero", a.x * b.y - a.y * b.x, 0);
  TestValidator.equals("exact determinant -u squared refuses identity", humanBodyFlexionAxesCollinear(a, b), false);
  TestValidator.equals("caller-owned finite values preserved", JSON.stringify([a, b]), before);
  for (const [zero, axis] of [[v(0, 0, 0), v(1, 0, 0)], [v(1, 0, 0), v(0, 0, 0)]])
    TestValidator.equals("zero supplies no axis", humanBodyFlexionAxesCollinear(zero, axis), false);
  for (const invalid of [NaN, Infinity, -Infinity]) {
    TestValidator.predicate("nonfinite first direction refuses", throwsError(() => humanBodyFlexionAxesCollinear(v(invalid, 0, 0), v(1, 0, 0)), "finite"));
    TestValidator.predicate("nonfinite second direction refuses", throwsError(() => humanBodyFlexionAxesCollinear(v(1, 0, 0), v(0, 0, invalid)), "finite"));
  }
};
