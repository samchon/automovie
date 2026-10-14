import {
  adjacentAutoMovieFloat64,
  interpolateAutoMovieTrianglePoint,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { throwsError, vclose } from "../internal/predicates";

/**
 * Binary64 neighbors and barycentric seats retain their representation boundaries without a spatial tolerance or coefficient correction.
 * Scenarios:
 * 1. Unit exponent boundaries carry/borrow on positive and negative encodings.
 * 2. Signed zero/subnormal neighbours and largest finite boundaries are exact.
 * 3. Nonfinite arithmetic refuses; ordinary weighted seating stays unchanged.
 * 4. Malformed/negative/nonunit weights refuse beside their supported boundary.
 * 5. The largest finite unit seat remains supported; an admitted rounded
 *    coefficient just above one must refuse when its weighted product overflows.
 *
 * @evidence contracts/testing.md#behavioral-verification Steps neighboring binary64 scalars and interpolates actual weighted seats, checking exact encoding including signed zero, finite inward limits, analytic coordinates and named refusal of malformed or overflowing arithmetic. Treating adjacent encodings as a spatial epsilon or silently renormalizing unsupported weights fails these cases.
 * @evidence contracts/testing.md#independent-expectations Binary64 unit spacings around one are 2^-52 upward and 2^-53 downward; signed subnormal steps follow their encodings. The authored triangle gives (.5,.5,1) at weights (.5,.25,.25), while a maximum finite coordinate times a coefficient above one overflows. Object.is intentionally owns zero-sign representation; vclose owns coordinate quantities.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both signs and step directions, carry/borrow exponent boundaries, zero/subnormal limits, maximum inward/outward steps, supported seats, absent/sparse/nonfinite/negative/nonunit weights, incomplete/sparse points and weighted overflow. Broader interval-enclosure and attachment geometry are owned by their operation tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named math entry directly calls portable arithmetic source on its original resident values. It installs no consumer, builds no native artifact, starts no process/browser/GPU and dynamically registers no cases.
 */
export function test_math_float64_neighbors(): void {
  for (const [value, upper, expected] of [
    [1, true, 1 + 2 ** -52],
    [1, false, 1 - 2 ** -53],
    [1 - 2 ** -53, true, 1],
    [-1, true, -(1 - 2 ** -53)],
    [-1, false, -(1 + 2 ** -52)],
    [-(1 - 2 ** -53), false, -1],
    [0, true, Number.MIN_VALUE],
    [0, false, -Number.MIN_VALUE],
    [Number.MIN_VALUE, false, 0],
    [-Number.MIN_VALUE, true, -0],
  ] as const)
    TestValidator.predicate(
      "independent binary64 adjacency",
      Object.is(adjacentAutoMovieFloat64(value, upper), expected),
    );
  for (const value of [NaN, Infinity, -Infinity])
    TestValidator.predicate(
      "nonfinite admission",
      throwsError((): number => adjacentAutoMovieFloat64(value, true), "representable"),
    );
  for (const [value, upper] of [
    [Number.MAX_VALUE, true],
    [-Number.MAX_VALUE, false],
  ] as const)
    TestValidator.predicate(
      "finite neighbour exhaustion",
      throwsError((): number => adjacentAutoMovieFloat64(value, upper), "overflowing"),
    );
  TestValidator.predicate(
    "largest finite inward neighbour remains finite",
    Number.isFinite(adjacentAutoMovieFloat64(Number.MAX_VALUE, false)) &&
      Number.isFinite(adjacentAutoMovieFloat64(-Number.MAX_VALUE, true)),
  );
  const points: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
    { x: 0, y: 2, z: 1 },
  ];
  TestValidator.predicate(
    "independent barycentric seat",
    vclose(interpolateAutoMovieTrianglePoint(points, [0.5, 0.25, 0.25]), {
      x: 0.5,
      y: 0.5,
      z: 1,
    }),
  );
  for (const weights of [
    [],
    [0, 0, 0],
    [1, 1, 1],
    [-1, 1, 1],
    [NaN, 0, 1],
    [Infinity, 0, 0],
  ])
    TestValidator.predicate(
      "invalid barycentric weights",
      throwsError(
        (): IAutoMovieVector3 => interpolateAutoMovieTrianglePoint(points, weights),
        "seating",
      ),
    );
  TestValidator.predicate(
    "invalid coordinate input",
    throwsError(
      (): IAutoMovieVector3 =>
        interpolateAutoMovieTrianglePoint(
          [{ ...points[0], x: NaN }, ...points.slice(1)],
          [1, 0, 0],
        ),
      "seating",
    ),
  );
  TestValidator.predicate(
    "invalid point count",
    throwsError(
      (): IAutoMovieVector3 => interpolateAutoMovieTrianglePoint(points.slice(1), [1, 0, 0]),
      "seating",
    ),
  );
  TestValidator.predicate(
    "sparse point run cannot become an origin seat",
    throwsError(
      (): IAutoMovieVector3 => interpolateAutoMovieTrianglePoint(new Array(3), [1, 0, 0]),
      "seating",
    ),
  );
  const sparseWeights: number[] = new Array<number>(3);
  sparseWeights[0] = 1;
  TestValidator.predicate(
    "sparse coefficients refuse beside dense unit coefficients",
    throwsError(
      (): IAutoMovieVector3 => interpolateAutoMovieTrianglePoint(points, sparseWeights),
      "seating",
    ),
  );
  const largest: IAutoMovieVector3[] = Array.from({ length: 3 }, (): IAutoMovieVector3 => ({
    x: Number.MAX_VALUE,
    y: 0,
    z: 0,
  }));
  TestValidator.predicate(
    "largest finite weighted seat remains supported",
    vclose(interpolateAutoMovieTrianglePoint(largest, [1, 0, 0]), largest[0]),
  );
  TestValidator.predicate(
    "rounded admitted coefficient cannot accept an overflowing seat",
    throwsError(
      (): IAutoMovieVector3 => interpolateAutoMovieTrianglePoint(largest, [1 + 2 ** -52, 0, 0]),
      "representable weighted coordinates",
    ),
  );
}
