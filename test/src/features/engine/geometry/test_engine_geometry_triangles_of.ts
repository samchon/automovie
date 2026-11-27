import {
  trianglesOf
} from "../../../../../packages/engine/src/geometry/planar-region/internal/trianglesOf";
import type { IAutoMovieProfilePoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `trianglesOf(points, rings)` ear-clips a canonical region (outer ring
 * counter-clockwise, holes clockwise) into counter-clockwise triangles over its
 * own point indices, bridging holes first.
 *
 * Scenarios:
 *
 * 1. The unit square: the ear at corner 0 is cut first, giving [3, 0, 1] then [1,
 *    2, 3].
 * 2. A 4 m square with a 2 m square hole: one bridged ring of 10 corners gives 8
 *    counter-clockwise triangles of total area 16 - 4 = 12, using every point;
 *    a 2 m square whose bottom edge holds the point (1, 0) gives 3 triangles,
 *    none of zero area (no ear is cut at the straight corner), total area 4.
 * 3. A clockwise outer ring has no ear ("could not find a valid ear"); a hole
 *    outside the outer ring has no visible bridge ("could not find a visible
 *    hole bridge").
 */
export function test_engine_geometry_triangles_of(): void {
  const ring = (...xy: number[]): IAutoMovieProfilePoint[] =>
    Array.from({ length: xy.length / 2 }, (_: unknown, i: number) => ({
      x: xy[2 * i]!,
      y: xy[2 * i + 1]!,
    }));
  const twice = (
    p: IAutoMovieProfilePoint[],
    a: number,
    b: number,
    c: number,
  ): number =>
    (p[b]!.x - p[a]!.x) * (p[c]!.y - p[a]!.y) -
    (p[b]!.y - p[a]!.y) * (p[c]!.x - p[a]!.x);

  // 1.
  TestValidator.equals(
    "square",
    trianglesOf(ring(0, 0, 1, 0, 1, 1, 0, 1), [{ start: 0, count: 4 }]),
    [3, 0, 1, 1, 2, 3],
  );

  // 2.
  const points: IAutoMovieProfilePoint[] = [
    ...ring(0, 0, 4, 0, 4, 4, 0, 4),
    ...ring(1, 1, 1, 3, 3, 3, 3, 1),
  ];
  const holed: number[] = trianglesOf(points, [
    { start: 0, count: 4 },
    { start: 4, count: 4 },
  ]);
  TestValidator.equals("triangles", holed.length, 24);
  const areas: number[] = Array.from(
    { length: 8 },
    (_: unknown, t: number): number =>
      twice(points, holed[3 * t]!, holed[3 * t + 1]!, holed[3 * t + 2]!),
  );
  TestValidator.predicate(
    "ccw",
    areas.every((a: number): boolean => a > 0),
  );
  TestValidator.predicate(
    "area",
    Math.abs(
      areas.reduce((s: number, a: number): number => s + a, 0) / 2 - 12,
    ) <= 1e-12,
  );
  TestValidator.equals(
    "every point",
    [...new Set(holed)].sort((a: number, b: number): number => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );

  const split: IAutoMovieProfilePoint[] = ring(1, 0, 2, 0, 2, 2, 0, 2, 0, 0);
  const fan: number[] = trianglesOf(split, [{ start: 0, count: 5 }]);
  const fanAreas: number[] = [0, 1, 2].map((t: number): number =>
    twice(split, fan[3 * t]!, fan[3 * t + 1]!, fan[3 * t + 2]!),
  );
  TestValidator.predicate(
    "collinear subdivision",
    fan.length === 9 &&
      fanAreas.every((a: number): boolean => a > 0) &&
      Math.abs(
        fanAreas.reduce((s: number, a: number): number => s + a, 0) / 2 - 4,
      ) <= 1e-12,
  );

  // 3.
  TestValidator.predicate(
    "clockwise",
    throwsError(
      (): unknown =>
        trianglesOf(ring(0, 0, 0, 1, 1, 1, 1, 0), [{ start: 0, count: 4 }]),
      "could not find a valid ear",
    ),
  );
  TestValidator.predicate(
    "hole outside",
    throwsError(
      (): unknown =>
        trianglesOf(
          [
            ...ring(0, 0, 4, 0, 4, 4, 0, 4),
            ...ring(10, 10, 10, 11, 11, 11, 11, 10),
          ],
          [
            { start: 0, count: 4 },
            { start: 4, count: 4 },
          ],
        ),
      "could not find a visible hole bridge",
    ),
  );
}
