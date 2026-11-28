import { AutoMovieEngineConstruction } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

type Point = [number, number];

/**
 * `orientSolidChart(a, b, c)` returns the exact sign of det(b - a, c -
 * a) of the represented binary64 inputs, so an exact contact is told from a
 * nearby point.
 *
 * Scenarios:
 *
 * 1. With N = 2^53 - 1, det((N, N - 1), (N - 1, N - 2)) = N (N - 2) - (N - 1)^2 =
 *    -1 although the two rounded products cancel; scaled by 2^-300, 1 and 2^300
 *    (exact), cyclically permuted it stays -1, reversed or reflected it is 1.
 * 2. Axis and diagonal cases read 1 and -1; collinear and identical points read 0;
 *    a determinant of -MIN_VALUE^2 (below every subnormal) reads -1; a
 *    determinant 2 MAX_VALUE times a signed unit ordinate, whose differences
 *    overflow, reads that unit's sign.
 * 3. Each coordinate of a caller's point is read once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names cancellation, scale extremes, axis and collinear cases, and the single-read guarantee.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public orientation owner with representative binary64 points and counted accessors, observing returned signs and read counts.
 * @evidence contracts/development/testing.md#independent-expectations The determinant N times (N−2) minus (N−1) squared is exactly −1. Power-of-two rescaling preserves sign. Reversing or reflecting a nonzero determinant changes its sign.
 */
export function test_engine_geometry_chart_orientation(): void {
  const sign = (label: string, a: Point, b: Point, c: Point, s: number): void =>
    TestValidator.equals(label, AutoMovieEngineConstruction.orientSolidChart(a, b, c), s);
  const N: number = 2 ** 53 - 1;

  // 1.
  for (const scale of [2 ** -300, 1, 2 ** 300]) {
    const a: Point = [0, 0];
    const b: Point = [N * scale, (N - 1) * scale];
    const c: Point = [(N - 1) * scale, (N - 2) * scale];
    sign(`cancellation ${scale}`, a, b, c, -1);
    sign(`cyclic ${scale}`, b, c, a, -1);
    sign(`reverse ${scale}`, a, c, b, 1);
    sign(`reflection ${scale}`, a, [b[1], b[0]], [c[1], c[0]], 1);
  }

  // 2.
  sign("axis positive", [0, 0], [2, 0], [1, 1], 1);
  sign("axis negative", [0, 0], [0, 2], [1, 1], -1);
  sign("diagonal", [1, 1], [3, 4], [-2, 5], 1);
  sign("collinear", [0, 0], [2, 2], [1, 1], 0);
  sign("identical", [2, 3], [2, 3], [-1, 5], 0);
  const m: number = Number.MIN_VALUE;
  sign("subnormal", [0, 0], [m, m], [2 * m, m], -1);
  const M: number = Number.MAX_VALUE;
  sign("overflow positive", [-M, -M], [M, M], [0, 1], 1);
  sign("overflow negative", [-M, -M], [M, M], [0, -1], -1);

  // 3.
  const reads: [number, number] = [0, 0];
  const own: Point = [0, 0];
  Object.defineProperties(own, {
    0: {
      get: (): number => {
        reads[0]++;
        return 0;
      },
    },
    1: {
      get: (): number => {
        reads[1]++;
        return 0;
      },
    },
  });
  sign("counted", own, [N, N - 1], [N - 1, N - 2], -1);
  TestValidator.equals("coordinate reads", reads, [1, 1]);
}
