import { AutoMovieEnginePlanarRegion } from "@automovie/engine";
import type { IAutoMovieProfilePoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieEnginePlanarRegion.triangulate({ outer, holes }, label)` lays a
 * planar region out canonically and ear-clips it, naming the region `label` in
 * diagnostics.
 *
 * Scenarios:
 *
 * 1. A clockwise unit square: points reversed to (1,0), (1,1), (0,1), (0,0),
 *    source indices [3, 2, 1, 0], area 1, triangles [3, 0, 1, 1, 2, 3].
 * 2. A two-point ring labelled "wall" is refused as "wall outer ring needs at
 *    least three points".
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names canonical winding and indices, area and deterministic ears, and named short-ring refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Triangulates an explicit clockwise square and a malformed wall ring and examines full emitted indices or diagnostic text.
 * @evidence contracts/development/testing.md#independent-expectations The square reverses to the stated counterclockwise order without changing area 1. A two-corner ring has no polygon interior and must be refused.
 */
export function test_engine_geometry_triangulate_region(): void {
  const ring = (...xy: number[]): IAutoMovieProfilePoint[] =>
    Array.from({ length: xy.length / 2 }, (_: unknown, i: number) => ({
      x: xy[2 * i]!,
      y: xy[2 * i + 1]!,
    }));

  // 1.
  TestValidator.equals(
    "square",
    AutoMovieEnginePlanarRegion.triangulate(
      { outer: ring(0, 0, 0, 1, 1, 1, 1, 0) },
      "square",
    ),
    {
      points: ring(1, 0, 1, 1, 0, 1, 0, 0),
      sourceIndices: [3, 2, 1, 0],
      rings: [{ start: 0, count: 4 }],
      area: 1,
      triangles: [3, 0, 1, 1, 2, 3],
    },
  );

  // 2.
  TestValidator.predicate(
    "label",
    throwsError(
      (): unknown =>
        AutoMovieEnginePlanarRegion.triangulate(
          { outer: ring(0, 0, 1, 0) },
          "wall",
        ),
      "wall outer ring needs at least three points",
    ),
  );
}
