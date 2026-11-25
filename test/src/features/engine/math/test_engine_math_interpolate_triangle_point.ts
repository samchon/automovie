import { interpolateAutoMovieTrianglePoint } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../../internal/predicates";

/**
 * `interpolateAutoMovieTrianglePoint` seats a point by barycentric weights, `Σ
 * wᵢ pᵢ` with nonnegative weights summing to one.
 *
 * Scenarios:
 *
 * 1. Weights (½, ¼, ¼) on (0,0,1), (2,0,1), (0,2,1) give (0.5, 0.5, 1).
 * 2. Weights summing to zero or three, or with a negative entry, are refused.
 * 3. The largest finite coordinate with unit weight is seated exactly.
 */
export function test_engine_math_interpolate_triangle_point(): void {
  // 1. The worked seat.
  const points: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
    { x: 0, y: 2, z: 1 },
  ];
  TestValidator.predicate(
    "the barycentric seat",
    vclose(interpolateAutoMovieTrianglePoint(points, [0.5, 0.25, 0.25]), {
      x: 0.5,
      y: 0.5,
      z: 1,
    }),
  );

  // 2. Weights off the simplex.
  for (const weights of [
    [0, 0, 0],
    [1, 1, 1],
    [-1, 1, 1],
  ])
    TestValidator.predicate(
      `weights ${weights.join(", ")} are refused`,
      throwsError(
        (): IAutoMovieVector3 =>
          interpolateAutoMovieTrianglePoint(points, weights),
        "seating",
      ),
    );

  // 3. The largest finite coordinate.
  const largest: IAutoMovieVector3[] = Array.from(
    { length: 3 },
    (): IAutoMovieVector3 => ({ x: Number.MAX_VALUE, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "the largest finite seat",
    vclose(interpolateAutoMovieTrianglePoint(largest, [1, 0, 0]), largest[0]!),
  );
}
