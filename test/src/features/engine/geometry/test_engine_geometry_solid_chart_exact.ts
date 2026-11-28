import {
  AutoMovieEngineConstruction,
  AutoMovieEngineMath,
} from "@automovie/engine";
import type { AutoMovieVector2Tuple } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Exact chart predicates preserve signs across binary64 scales and refuse
 * nonfinite coordinates before computing a sign.
 *
 * Scenarios:
 *
 * 1. Squares at subnormal, unit and extreme scales give the same positive
 *    orientation, positive centre sign and zero sign at the fourth corner.
 * 2. A nearly collinear subnormal pair gives a nonzero orientation sign.
 * 3. An axis-aligned nonfinite input and the in-circle fallback both refuse.
 * 4. Diagonal determinants survive an underflowed or overflowed intermediate. A
 *    matrix with a NaN entry is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes finite exact signs, the nonfinite inputs and the extreme determinant fallback.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the public Construction sign and exception results and the Math determinant result on the original coordinate and matrix inputs.
 * @evidence contracts/development/testing.md#independent-expectations The square's centre and fourth corner are respectively inside and on the circle. The subnormal lattice determinant is 3 times the squared scale. Two equal powers of two and their inverse multiply to the repeated power on the diagonal.
 */
export function test_engine_geometry_solid_chart_exact(): void {
  const orient = AutoMovieEngineConstruction.orientSolidChart;
  const incircle = AutoMovieEngineConstruction.incircleSolidChart;
  for (const radius of [8 * Number.MIN_VALUE, 1, Number.MAX_VALUE]) {
    const a: AutoMovieVector2Tuple = [-radius, -radius];
    const b: AutoMovieVector2Tuple = [radius, -radius];
    const c: AutoMovieVector2Tuple = [radius, radius];
    TestValidator.equals(`orientation ${radius}`, orient(a, b, c), 1);
    TestValidator.equals(`inside ${radius}`, incircle(a, b, c, [0, -0]), 1);
    TestValidator.equals(`reversed ${radius}`, incircle(c, b, a, [0, 0]), -1);
    TestValidator.equals(
      `on circle ${radius}`,
      incircle(a, b, c, [-radius, radius]),
      0,
    );
  }

  const s: number = Number.MIN_VALUE;
  TestValidator.equals(
    "subnormal orientation",
    orient([s, s], [3 * s, 2 * s], [2 * s, 3 * s]),
    1,
  );

  const large: number = 2 ** 600;
  const small: number = 2 ** -600;
  for (const [first, last] of [
    [small, large],
    [large, small],
  ] as const)
    TestValidator.predicate(
      `exact determinant with first diagonal entry ${first}`,
      AutoMovieEngineMath.determinantMatrix3([
        first,
        0,
        0,
        0,
        first,
        0,
        0,
        0,
        last,
      ]) === first,
    );

  const misses: string[] = [];
  const refuse = (label: string, action: () => number): void => {
    try {
      action();
      misses.push(label);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  };
  refuse("axis-aligned orientation", () =>
    orient([0, 0], [0, 1], [Number.NaN, 1]),
  );
  refuse("general orientation", () => orient([0, 0], [1, 1], [Infinity, 0]));
  refuse("circle", () => incircle([0, 0], [1, 0], [1, 1], [0, -Infinity]));
  refuse("matrix determinant", () =>
    AutoMovieEngineMath.determinantMatrix3([
      Number.NaN,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
  );
  TestValidator.equals("nonfinite chart refusals", misses, []);
}
