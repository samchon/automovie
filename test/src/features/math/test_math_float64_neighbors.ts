import {
  adjacentAutoMovieFloat64,
  interpolateAutoMovieTrianglePoint,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../internal/predicates";

/**
 * Binary64 neighbouring scalars and unchanged barycentric seating share explicit
 * arithmetic boundaries instead of a spatial tolerance or seat correction.
 * Scenarios:
 * 1. Unit exponent boundaries carry/borrow on positive and negative encodings.
 * 2. Signed zero/subnormal neighbours and largest finite boundaries are exact.
 * 3. Nonfinite arithmetic refuses; ordinary weighted seating stays unchanged.
 * 4. Malformed/negative/nonunit weights refuse beside their supported boundary.
 * 5. The largest finite unit seat remains supported; an admitted rounded
 *    coefficient just above one must refuse when its weighted product overflows.
 */
export const test_math_float64_neighbors = (): void => {
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
      throwsError(() => adjacentAutoMovieFloat64(value, true), "representable"),
    );
  for (const [value, upper] of [
    [Number.MAX_VALUE, true],
    [-Number.MAX_VALUE, false],
  ] as const)
    TestValidator.predicate(
      "finite neighbour exhaustion",
      throwsError(() => adjacentAutoMovieFloat64(value, upper), "overflowing"),
    );
  TestValidator.predicate(
    "largest finite inward neighbour remains finite",
    Number.isFinite(adjacentAutoMovieFloat64(Number.MAX_VALUE, false)) &&
      Number.isFinite(adjacentAutoMovieFloat64(-Number.MAX_VALUE, true)),
  );
  const points = [
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
        () => interpolateAutoMovieTrianglePoint(points, weights),
        "seating",
      ),
    );
  TestValidator.predicate(
    "invalid coordinate input",
    throwsError(
      () =>
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
      () => interpolateAutoMovieTrianglePoint(points.slice(1), [1, 0, 0]),
      "seating",
    ),
  );
  TestValidator.predicate(
    "sparse point run cannot become an origin seat",
    throwsError(
      () => interpolateAutoMovieTrianglePoint(new Array(3), [1, 0, 0]),
      "seating",
    ),
  );
  const sparseWeights = new Array<number>(3);
  sparseWeights[0] = 1;
  TestValidator.predicate(
    "sparse coefficients refuse beside dense unit coefficients",
    throwsError(
      () => interpolateAutoMovieTrianglePoint(points, sparseWeights),
      "seating",
    ),
  );
  const largest = Array.from({ length: 3 }, () => ({
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
      () =>
        interpolateAutoMovieTrianglePoint(largest, [1 + 2 ** -52, 0, 0]),
      "representable weighted coordinates",
    ),
  );
};
